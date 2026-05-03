import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { organizations, organizationMembers, employees, departments, branches } from "@workspace/db";
import { eq, count, desc, isNotNull } from "drizzle-orm";
import { requireSuperAdmin } from "../middlewares/requireSuperAdmin";

const router = Router();

router.get("/super-admin/check", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }
    const superAdminIds = (process.env.SUPER_ADMIN_USER_IDS ?? "")
      .split(",")
      .map((id) => id.trim())
      .filter(Boolean);
    res.json({ isSuperAdmin: superAdminIds.includes(userId), userId });
  } catch (err) {
    req.log.error({ err }, "Failed to check super admin");
    res.status(500).json({ error: "Failed to check" });
  }
});

router.get("/super-admin/stats", requireSuperAdmin, async (req, res) => {
  try {
    const [[orgCount], [memberCount], [employeeCount], [deptCount]] = await Promise.all([
      db.select({ count: count() }).from(organizations),
      db.select({ count: count() }).from(organizationMembers),
      db.select({ count: count() }).from(employees).where(isNotNull(employees.orgId)),
      db.select({ count: count() }).from(departments).where(isNotNull(departments.orgId)),
    ]);

    res.json({
      totalOrganizations: Number(orgCount?.count ?? 0),
      totalMembers: Number(memberCount?.count ?? 0),
      totalEmployees: Number(employeeCount?.count ?? 0),
      totalDepartments: Number(deptCount?.count ?? 0),
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get super admin stats");
    res.status(500).json({ error: "Failed to get stats" });
  }
});

router.get("/super-admin/organizations", requireSuperAdmin, async (req, res) => {
  try {
    const [allOrgs, memberCounts, employeeCounts] = await Promise.all([
      db.select().from(organizations).orderBy(desc(organizations.createdAt)),
      db.select({ orgId: organizationMembers.orgId, cnt: count() })
        .from(organizationMembers)
        .groupBy(organizationMembers.orgId),
      db.select({ orgId: employees.orgId, cnt: count() })
        .from(employees)
        .where(isNotNull(employees.orgId))
        .groupBy(employees.orgId),
    ]);

    const memberMap = new Map(memberCounts.map((m) => [m.orgId, Number(m.cnt)]));
    const empMap = new Map(employeeCounts.map((e) => [e.orgId!, Number(e.cnt)]));

    res.json(
      allOrgs.map((org) => ({
        ...org,
        memberCount: memberMap.get(org.id) ?? 0,
        employeeCount: empMap.get(org.id) ?? 0,
      })),
    );
  } catch (err) {
    req.log.error({ err }, "Failed to list organizations");
    res.status(500).json({ error: "Failed to list organizations" });
  }
});

router.get("/super-admin/organizations/:id", requireSuperAdmin, async (req, res) => {
  try {
    const orgId = parseInt(req.params.id, 10);
    if (isNaN(orgId)) { res.status(400).json({ error: "Invalid org ID" }); return; }

    const [[org], members, [empCount], [deptCount], [branchCount], recentEmployees] =
      await Promise.all([
        db.select().from(organizations).where(eq(organizations.id, orgId)).limit(1),
        db.select().from(organizationMembers).where(eq(organizationMembers.orgId, orgId)),
        db.select({ count: count() }).from(employees).where(eq(employees.orgId, orgId)),
        db.select({ count: count() }).from(departments).where(eq(departments.orgId, orgId)),
        db.select({ count: count() }).from(branches).where(eq(branches.orgId, orgId)),
        db.select().from(employees).where(eq(employees.orgId, orgId)).orderBy(desc(employees.createdAt)).limit(5),
      ]);

    if (!org) { res.status(404).json({ error: "Organization not found" }); return; }

    res.json({
      ...org,
      members,
      employeeCount: Number(empCount?.count ?? 0),
      departmentCount: Number(deptCount?.count ?? 0),
      branchCount: Number(branchCount?.count ?? 0),
      recentEmployees,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get org detail");
    res.status(500).json({ error: "Failed to get org detail" });
  }
});

router.delete("/super-admin/organizations/:id", requireSuperAdmin, async (req, res) => {
  try {
    const orgId = parseInt(req.params.id, 10);
    if (isNaN(orgId)) { res.status(400).json({ error: "Invalid org ID" }); return; }

    await db.delete(employees).where(eq(employees.orgId, orgId));
    await db.delete(departments).where(eq(departments.orgId, orgId));
    await db.delete(branches).where(eq(branches.orgId, orgId));
    await db.delete(organizationMembers).where(eq(organizationMembers.orgId, orgId));
    const [deleted] = await db.delete(organizations).where(eq(organizations.id, orgId)).returning();

    if (!deleted) { res.status(404).json({ error: "Organization not found" }); return; }

    res.json({ success: true, deleted: { id: orgId, name: deleted.name } });
  } catch (err) {
    req.log.error({ err }, "Failed to delete organization");
    res.status(500).json({ error: "Failed to delete organization" });
  }
});

router.patch("/super-admin/organizations/:id", requireSuperAdmin, async (req, res) => {
  try {
    const orgId = parseInt(req.params.id, 10);
    if (isNaN(orgId)) { res.status(400).json({ error: "Invalid org ID" }); return; }

    const { name, industry, logoUrl, primaryColor, accentColor } = req.body ?? {};
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = String(name).trim();
    if (industry !== undefined) updates.industry = industry || null;
    if (logoUrl !== undefined) updates.logoUrl = logoUrl || null;
    if (primaryColor !== undefined) updates.primaryColor = String(primaryColor);
    if (accentColor !== undefined) updates.accentColor = String(accentColor);

    const [org] = await db.update(organizations).set(updates).where(eq(organizations.id, orgId)).returning();
    if (!org) { res.status(404).json({ error: "Organization not found" }); return; }

    res.json(org);
  } catch (err) {
    req.log.error({ err }, "Failed to update org");
    res.status(500).json({ error: "Failed to update organization" });
  }
});

export default router;
