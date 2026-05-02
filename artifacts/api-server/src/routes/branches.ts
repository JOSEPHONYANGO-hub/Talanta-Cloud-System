import { Router } from "express";
import { db } from "@workspace/db";
import { branches, employees } from "@workspace/db";
import { eq, count } from "drizzle-orm";
import {
  CreateBranchBody,
  UpdateBranchParams,
  UpdateBranchBody,
  DeleteBranchParams,
} from "@workspace/api-zod";

const router = Router();

router.get("/branches", async (req, res) => {
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
      .groupBy(branches.id);

    res.json(rows);
  } catch (err) {
    req.log.error({ err }, "Failed to list branches");
    res.status(500).json({ error: "Failed to list branches" });
  }
});

router.post("/branches", async (req, res) => {
  try {
    const body = CreateBranchBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const [br] = await db.insert(branches).values(body.data).returning();
    res.status(201).json({ ...br, employeeCount: 0 });
  } catch (err) {
    req.log.error({ err }, "Failed to create branch");
    res.status(500).json({ error: "Failed to create branch" });
  }
});

router.put("/branches/:id", async (req, res) => {
  try {
    const params = UpdateBranchParams.safeParse({ id: req.params.id });
    if (!params.success) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const body = UpdateBranchBody.safeParse(req.body);
    if (!body.success) {
      res.status(400).json({ error: body.error.message });
      return;
    }
    const [br] = await db
      .update(branches)
      .set(body.data)
      .where(eq(branches.id, params.data.id))
      .returning();

    if (!br) {
      res.status(404).json({ error: "Branch not found" });
      return;
    }

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

router.delete("/branches/:id", async (req, res) => {
  try {
    const params = DeleteBranchParams.safeParse({ id: req.params.id });
    if (!params.success) {
      res.status(400).json({ error: "Invalid ID" });
      return;
    }
    const [deleted] = await db
      .delete(branches)
      .where(eq(branches.id, params.data.id))
      .returning();

    if (!deleted) {
      res.status(404).json({ error: "Branch not found" });
      return;
    }
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to delete branch");
    res.status(500).json({ error: "Failed to delete branch" });
  }
});

export default router;
