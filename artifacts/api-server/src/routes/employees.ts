import { Router } from "express";
import { db } from "@workspace/db";
import { employees, departments, branches } from "@workspace/db";
import { eq, ilike, and, sql, inArray } from "drizzle-orm";
import {
  CreateEmployeeBody,
  UpdateEmployeeBody,
  ListEmployeesQueryParams,
  GetEmployeeParams,
  UpdateEmployeeParams,
  DeleteEmployeeParams,
} from "@workspace/api-zod";

const router = Router();

router.patch("/employees/bulk-status", async (req, res) => {
  try {
    const { ids, status } = req.body ?? {};
    if (
      !Array.isArray(ids) ||
      ids.length === 0 ||
      !ids.every((id: unknown) => typeof id === "number" && Number.isInteger(id) && id > 0) ||
      (status !== "active" && status !== "inactive")
    ) {
      res.status(400).json({ error: "ids must be a non-empty array of positive integers and status must be 'active' or 'inactive'" });
      return;
    }
    await db
      .update(employees)
      .set({ status, updatedAt: new Date() })
      .where(inArray(employees.id, ids));
    res.json({ updated: ids.length });
  } catch (err) {
    req.log.error({ err }, "Failed to bulk-update employee status");
    res.status(500).json({ error: "Failed to update employees" });
  }
});

router.get("/employees/export", async (req, res) => {
  try {
    const query = ListEmployeesQueryParams.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: "Invalid query parameters" });
      return;
    }
    const { search, department, branch, status } = query.data;

    const conditions = [];
    if (search) conditions.push(ilike(employees.fullName, `%${search}%`));
    if (department) conditions.push(eq(employees.departmentId, parseInt(department)));
    if (branch) conditions.push(eq(employees.branchId, parseInt(branch)));
    if (status) conditions.push(eq(employees.status, status));

    const rows = await db
      .select({
        id: employees.id,
        fullName: employees.fullName,
        jobTitle: employees.jobTitle,
        departmentName: departments.name,
        branchName: branches.name,
        email: employees.email,
        phone: employees.phone,
        status: employees.status,
        dateOfEmployment: employees.dateOfEmployment,
        createdAt: employees.createdAt,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(branches, eq(employees.branchId, branches.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(employees.fullName);

    const headers = [
      "ID", "Full Name", "Job Title", "Department", "Branch",
      "Email", "Phone", "Status", "Date of Employment", "Record Created"
    ];

    const escape = (val: string | number | null | undefined) => {
      if (val === null || val === undefined) return "";
      const str = String(val);
      return str.includes(",") || str.includes('"') || str.includes("\n")
        ? `"${str.replace(/"/g, '""')}"`
        : str;
    };

    const csvLines = [
      headers.join(","),
      ...rows.map(r =>
        [
          r.id,
          r.fullName,
          r.jobTitle,
          r.departmentName,
          r.branchName,
          r.email,
          r.phone,
          r.status,
          r.dateOfEmployment,
          r.createdAt ? new Date(r.createdAt).toISOString().split("T")[0] : "",
        ]
          .map(escape)
          .join(",")
      ),
    ];

    const csv = csvLines.join("\r\n");
    const filename = `talanta-employees-${new Date().toISOString().split("T")[0]}.csv`;

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  } catch (err) {
    req.log.error({ err }, "Failed to export employees");
    res.status(500).json({ error: "Failed to export employees" });
  }
});

router.get("/employees", async (req, res) => {
  try {
    const query = ListEmployeesQueryParams.safeParse(req.query);
    if (!query.success) {
      res.status(400).json({ error: "Invalid query parameters" });
      return;
    }
    const { search, department, branch, status } = query.data;

    const conditions = [];
    if (search) {
      conditions.push(ilike(employees.fullName, `%${search}%`));
    }
    if (department) {
      conditions.push(eq(employees.departmentId, parseInt(department)));
    }
    if (branch) {
      conditions.push(eq(employees.branchId, parseInt(branch)));
    }
    if (status) {
      conditions.push(eq(employees.status, status));
    }

    const rows = await db
      .select({
        id: employees.id,
        fullName: employees.fullName,
        jobTitle: employees.jobTitle,
        departmentId: employees.departmentId,
        departmentName: departments.name,
        branchId: employees.branchId,
        branchName: branches.name,
        phone: employees.phone,
        email: employees.email,
        dateOfEmployment: employees.dateOfEmployment,
        status: employees.status,
        photoUrl: employees.photoUrl,
        summary: employees.summary,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(branches, eq(employees.branchId, branches.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to list employees");
    res.status(500).json({ error: "Failed to list employees" });
  }
});

router.post("/employees", async (req, res) => {
  try {
    const body = CreateEmployeeBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const [emp] = await db
      .insert(employees)
      .values({
        ...body.data,
        status: body.data.status ?? "active",
      })
      .returning();

    const dept = emp.departmentId
      ? await db.select().from(departments).where(eq(departments.id, emp.departmentId)).limit(1)
      : [];
    const br = emp.branchId
      ? await db.select().from(branches).where(eq(branches.id, emp.branchId)).limit(1)
      : [];

    res.status(201).json({
      ...emp,
      departmentName: dept[0]?.name ?? null,
      branchName: br[0]?.name ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to create employee");
    res.status(500).json({ error: "Failed to create employee" });
  }
});

router.get("/employees/:id", async (req, res) => {
  try {
    const params = GetEmployeeParams.safeParse({ id: req.params.id });
    if (!params.success) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const rows = await db
      .select({
        id: employees.id,
        fullName: employees.fullName,
        jobTitle: employees.jobTitle,
        departmentId: employees.departmentId,
        departmentName: departments.name,
        branchId: employees.branchId,
        branchName: branches.name,
        phone: employees.phone,
        email: employees.email,
        dateOfEmployment: employees.dateOfEmployment,
        status: employees.status,
        photoUrl: employees.photoUrl,
        summary: employees.summary,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
      })
      .from(employees)
      .leftJoin(departments, eq(employees.departmentId, departments.id))
      .leftJoin(branches, eq(employees.branchId, branches.id))
      .where(eq(employees.id, params.data.id))
      .limit(1);

    if (!rows[0]) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }
    res.json(rows[0]);
  } catch (err) {
    req.log.error({ err }, "Failed to get employee");
    res.status(500).json({ error: "Failed to get employee" });
  }
});

router.put("/employees/:id", async (req, res) => {
  try {
    const params = UpdateEmployeeParams.safeParse({ id: req.params.id });
    if (!params.success) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const body = UpdateEmployeeBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const [emp] = await db
      .update(employees)
      .set({ ...body.data, updatedAt: new Date() })
      .where(eq(employees.id, params.data.id))
      .returning();

    if (!emp) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }

    const dept = emp.departmentId
      ? await db.select().from(departments).where(eq(departments.id, emp.departmentId)).limit(1)
      : [];
    const br = emp.branchId
      ? await db.select().from(branches).where(eq(branches.id, emp.branchId)).limit(1)
      : [];

    res.json({
      ...emp,
      departmentName: dept[0]?.name ?? null,
      branchName: br[0]?.name ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to update employee");
    res.status(500).json({ error: "Failed to update employee" });
  }
});

router.delete("/employees/:id", async (req, res) => {
  try {
    const params = DeleteEmployeeParams.safeParse({ id: req.params.id });
    if (!params.success) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const [deleted] = await db
      .delete(employees)
      .where(eq(employees.id, params.data.id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Employee not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete employee");
    res.status(500).json({ error: "Failed to delete employee" });
  }
});

export default router;
