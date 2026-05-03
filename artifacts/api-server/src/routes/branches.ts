import { Router } from "express";
import { db } from "@workspace/db";
import { branches, employees } from "@workspace/db";
import { eq, count, and } from "drizzle-orm";
import {
  CreateBranchBody,
  UpdateBranchParams,
  UpdateBranchBody,
  DeleteBranchParams,
} from "@workspace/api-zod";
import { requireOrg } from "../middlewares/requireOrg";

const router = Router();

router.get("/branches", requireOrg, async (req, res) => {
  try {
    const rows = await db
      .select({
        id: branches.id,
        name: branches.name,
        location: branches.location,
        createdAt: branches.createdAt,
        employeeCount: count(employees.id),
      })
      .from(branches)
      .leftJoin(employees, eq(branches.id, employees.branchId))
      .where(eq(branches.orgId, req.orgId))
      .groupBy(branches.id);

    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to list branches");
    res.status(500).json({ error: "Failed to list branches" });
  }
});

router.post("/branches", requireOrg, async (req, res) => {
  try {
    const body = CreateBranchBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const [br] = await db
      .insert(branches)
      .values({ ...body.data, orgId: req.orgId })
      .returning();
    res.status(201).json({ ...br, employeeCount: 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to create branch");
    res.status(500).json({ error: "Failed to create branch" });
  }
});

router.put("/branches/:id", requireOrg, async (req, res) => {
  try {
    const params = UpdateBranchParams.safeParse({ id: req.params.id });
    if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }
    const body = UpdateBranchBody.safeParse(req.body);
    if (!body.success) { res.status(400).json({ error: body.error.message }); return; }

    const [br] = await db
      .update(branches)
      .set(body.data)
      .where(and(eq(branches.id, params.data.id), eq(branches.orgId, req.orgId)))
      .returning();

    if (!br) { res.status(404).json({ error: "Branch not found" }); return; }

    const [empCount] = await db
      .select({ count: count(employees.id) })
      .from(employees)
      .where(eq(employees.branchId, br.id));

    res.json({ ...br, employeeCount: empCount?.count ?? 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to update branch");
    res.status(500).json({ error: "Failed to update branch" });
  }
});

router.delete("/branches/:id", requireOrg, async (req, res) => {
  try {
    const params = DeleteBranchParams.safeParse({ id: req.params.id });
    if (!params.success) { res.status(400).json({ error: "Invalid ID" }); return; }

    const [deleted] = await db
      .delete(branches)
      .where(and(eq(branches.id, params.data.id), eq(branches.orgId, req.orgId)))
      .returning();

    if (!deleted) { res.status(404).json({ error: "Branch not found" }); return; }
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete branch");
    res.status(500).json({ error: "Failed to delete branch" });
  }
});

export default router;
