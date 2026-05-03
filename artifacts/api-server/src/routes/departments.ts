import { Router } from "express";
import { db } from "@workspace/db";
import { departments, employees } from "@workspace/db";
import { eq, count, and } from "drizzle-orm";
import {
  CreateDepartmentBody,
  UpdateDepartmentParams,
  UpdateDepartmentBody,
  DeleteDepartmentParams,
} from "@workspace/api-zod";
import { requireOrg } from "../middlewares/requireOrg";
import { requireRole } from "../middlewares/requireRole";

const router = Router();

router.get("/departments", requireOrg, async (req, res) => {
  try {
    const rows = await db
      .select({
        id: departments.id,
        name: departments.name,
        description: departments.description,
        createdAt: departments.createdAt,
        employeeCount: count(employees.id),
      })
      .from(departments)
      .leftJoin(employees, eq(departments.id, employees.departmentId))
      .where(eq(departments.orgId, req.orgId))
      .groupBy(departments.id);

    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to list departments");
    res.status(500).json({ error: "Failed to list departments" });
  }
});

router.post("/departments", requireOrg, requireRole("admin"), async (req, res) => {
  try {
    const body = CreateDepartmentBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const [dept] = await db
      .insert(departments)
      .values({ ...body.data, orgId: req.orgId })
      .returning();
    res.status(201).json({ ...dept, employeeCount: 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to create department");
    res.status(500).json({ error: "Failed to create department" });
  }
});

router.put("/departments/:id", requireOrg, requireRole("admin"), async (req, res) => {
  try {
    const params = UpdateDepartmentParams.safeParse({ id: req.params.id });
    if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }
    const body = UpdateDepartmentBody.safeParse(req.body);
    if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

    const [dept] = await db
      .update(departments)
      .set(body.data)
      .where(and(eq(departments.id, params.data.id), eq(departments.orgId, req.orgId)))
      .returning();

    if (!dept) { res.status(404).json({ error: "Department not found" }); return; }

    const [empCount] = await db
      .select({ count: count(employees.id) })
      .from(employees)
      .where(eq(employees.departmentId, dept.id));

    res.json({ ...dept, employeeCount: empCount?.count ?? 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to update department");
    res.status(500).json({ error: "Failed to update department" });
  }
});

router.delete("/departments/:id", requireOrg, requireRole("admin"), async (req, res) => {
  try {
    const params = DeleteDepartmentParams.safeParse({ id: req.params.id });
    if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }

    const [deleted] = await db
      .delete(departments)
      .where(and(eq(departments.id, params.data.id), eq(departments.orgId, req.orgId)))
      .returning();

    if (!deleted) { res.status(404).json({ error: "Department not found" }); return; }
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete department");
    res.status(500).json({ error: "Failed to delete department" });
  }
});

export default router;
