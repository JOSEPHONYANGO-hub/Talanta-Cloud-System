import { Router } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db } from "@workspace/db";
import { activityLogs } from "@workspace/db";
import { desc, eq } from "drizzle-orm";
import { requireOrg } from "../middlewares/requireOrg";

const router = Router();

async function enrichActor(userId: string) {
  try {
    const user = await clerkClient.users.getUser(userId);
    return {
      userId,
      fullName: user.fullName ?? null,
      email: user.primaryEmailAddress?.emailAddress ?? null,
      imageUrl: user.imageUrl ?? null,
    };
  } catch {
    return { userId, fullName: null, email: null, imageUrl: null };
  }
}

router.get("/activity", requireOrg, async (req, res) => {
  try {
    const limit = Math.min(Number(req.query.limit ?? 20), 50);
    const logs = await db
      .select()
      .from(activityLogs)
      .where(eq(activityLogs.orgId, req.orgId))
      .orderBy(desc(activityLogs.createdAt))
      .limit(limit);

    const enriched = await Promise.all(
      logs.map(async (log) => ({ ...log, actor: await enrichActor(log.actorUserId) })),
    );

    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Failed to list activity");
    res.status(500).json({ error: "Failed to list activity" });
  }
});

export async function createActivityLog(input: {
  orgId: number;
  actorUserId: string;
  action: string;
  entityType: string;
  entityId?: string | number | null;
  metadata?: Record<string, unknown>;
}) {
  await db.insert(activityLogs).values({
    orgId: input.orgId,
    actorUserId: input.actorUserId,
    action: input.action,
    entityType: input.entityType,
    entityId: input.entityId == null ? null : String(input.entityId),
    metadata: input.metadata ?? {},
  });
}

export default router;
