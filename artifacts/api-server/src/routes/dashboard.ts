import { Router } from "express";
import { db } from "@workspace/db";
import { employees, departments, branches } from "@workspace/db";
import { eq, count, sql } from "drizzle-orm";

const router = Router();

router.get("/dashboard/stats", async (req, res) => {
  try {
    const [totalRow] = await db.select({ count: count() }).from(employees);
    const [activeRow] = await db
      .select({ count: count() })
      .from(employees)
      .where(eq(employees.status, "active"));
    const [deptRow] = await db.select({ count: count() }).from(departments);
    const [branchRow] = await db.select({ count: count() }).from(branches);

    const now = new Date();
    const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [newThisMonthRow] = await db
      .select({ count: count() })
      .from(employees)
      .where(sql`${employees.createdAt} >= ${firstOfMonth}`);

    res.json({
      totalEmployees: totalRow?.count ?? 0,
      activeEmployees: activeRow?.count ?? 0,
      totalDepartments: deptRow?.count ?? 0,
      totalBranches: branchRow?.count ?? 0,
      newThisMonth: newThisMonthRow?.count ?? 0,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get dashboard stats");
    res.status(500).json({ error: "Failed to get dashboard stats" });
  }
});

router.get("/dashboard/employees-by-department", async (req, res) => {
  try {
    const rows = await db
      .select({
        name: departments.name,
        count: count(employees.id),
      })
      .from(departments)
      .leftJoin(employees, eq(departments.id, employees.departmentId))
      .groupBy(departments.name);

    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to get employees by department");
    res.status(500).json({ error: "Failed to get employees by department" });
  }
});

router.get("/dashboard/employees-by-branch", async (req, res) => {
  try {
    const rows = await db
      .select({
        name: branches.name,
        count: count(employees.id),
      })
      .from(branches)
      .leftJoin(employees, eq(branches.id, employees.branchId))
      .groupBy(branches.name);

    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to get employees by branch");
    res.status(500).json({ error: "Failed to get employees by branch" });
  }
});

router.get("/dashboard/recent-employees", async (req, res) => {
  try {
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
      .orderBy(sql`${employees.createdAt} DESC`)
      .limit(5);

    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to get recent employees");
    res.status(500).json({ error: "Failed to get recent employees" });
  }
});

export default router;
