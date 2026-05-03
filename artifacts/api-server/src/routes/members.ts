import { Router } from "express";
import { getAuth, clerkClient } from "@clerk/express";
import { db } from "@workspace/db";
import { organizationMembers } from "@workspace/db";
import { eq, and } from "drizzle-orm";
import { requireOrg } from "../middlewares/requireOrg";
import { requireRole } from "../middlewares/requireRole";

const router = Router();

async function enrichMember(m: typeof organizationMembers.$inferSelect) {
  try {
    const user = await clerkClient.users.getUser(m.userId);
    return {
      ...m,
      email: user.primaryEmailAddress?.emailAddress ?? null,
      fullName: user.fullName ?? null,
      imageUrl: user.imageUrl ?? null,
    };
  } catch {
    return { ...m, email: null, fullName: null, imageUrl: null };
  }
}

router.get("/members", requireOrg, async (req, res) => {
  try {
    const members = await db
      .select()
      .from(organizationMembers)
      .where(eq(organizationMembers.orgId, req.orgId));

    const enriched = await Promise.all(members.map(enrichMember));

    const roleOrder: Record<string, number> = { owner: 0, admin: 1, member: 2 };
    enriched.sort((a, b) => (roleOrder[a.role] ?? 9) - (roleOrder[b.role] ?? 9));

    res.json(enriched);
  } catch (err) {
    req.log.error({ err }, "Failed to list members");
    res.status(500).json({ error: "Failed to list members" });
  }
});

router.post("/members", requireOrg, requireRole("admin"), async (req, res) => {
  try {
    const { email, role, userId: directUserId } = req.body ?? {};

    let targetUserId: string | undefined;
    let clerkUser: Awaited<ReturnType<typeof clerkClient.users.getUser>> | undefined;

    if (directUserId && typeof directUserId === "string") {
      try {
        clerkUser = await clerkClient.users.getUser(directUserId);
        targetUserId = clerkUser.id;
      } catch {
        res.status(404).json({ error: `No account found with that user ID.` });
        return;
      }
    } else if (email && typeof email === "string") {
      const users = await clerkClient.users.getUserList({
        emailAddress: [email.toLowerCase().trim()],
      });
      clerkUser = users.data[0];
      if (!clerkUser) {
        res.status(404).json({
          error: `No Talanta account found for "${email}". The person must sign up first.`,
        });
        return;
      }
      targetUserId = clerkUser.id;
    } else {
      res.status(400).json({ error: "Provide an email or userId to add a member." });
      return;
    }

    const finalRole = (["admin", "member"] as const).includes(role) ? role : "member";

    const [existing] = await db
      .select()
      .from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, req.orgId), eq(organizationMembers.userId, targetUserId!)))
      .limit(1);

    if (existing) {
      res.status(409).json({ error: "This user is already a member of your organization." });
      return;
    }

    const [member] = await db
      .insert(organizationMembers)
      .values({ orgId: req.orgId, userId: targetUserId!, role: finalRole })
      .returning();

    res.status(201).json({
      ...member,
      email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
      fullName: clerkUser.fullName ?? null,
      imageUrl: clerkUser.imageUrl ?? null,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to add member");
    res.status(500).json({ error: "Failed to add member" });
  }
});

router.patch("/members/:userId", requireOrg, requireRole("owner"), async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const { role } = req.body ?? {};
    const { userId: currentUserId } = getAuth(req);

    if (!["admin", "member"].includes(role)) {
      res.status(400).json({ error: "Role must be 'admin' or 'member'" });
      return;
    }
    if (targetUserId === currentUserId) {
      res.status(400).json({ error: "You cannot change your own role." });
      return;
    }

    const [target] = await db
      .select()
      .from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, req.orgId), eq(organizationMembers.userId, targetUserId)))
      .limit(1);

    if (!target) { res.status(404).json({ error: "Member not found" }); return; }
    if (target.role === "owner") {
      res.status(400).json({ error: "Cannot change the role of the organization owner." });
      return;
    }

    const [updated] = await db
      .update(organizationMembers)
      .set({ role })
      .where(and(eq(organizationMembers.orgId, req.orgId), eq(organizationMembers.userId, targetUserId)))
      .returning();

    res.json(await enrichMember(updated));
  } catch (err) {
    req.log.error({ err }, "Failed to update member role");
    res.status(500).json({ error: "Failed to update member role" });
  }
});

router.delete("/members/:userId", requireOrg, requireRole("admin"), async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const { userId: currentUserId } = getAuth(req);

    if (targetUserId === currentUserId) {
      res.status(400).json({ error: "You cannot remove yourself from the organization." });
      return;
    }

    const [target] = await db
      .select()
      .from(organizationMembers)
      .where(and(eq(organizationMembers.orgId, req.orgId), eq(organizationMembers.userId, targetUserId)))
      .limit(1);

    if (!target) { res.status(404).json({ error: "Member not found" }); return; }
    if (target.role === "owner") {
      res.status(400).json({ error: "Cannot remove the organization owner." });
      return;
    }
    if (target.role === "admin" && req.orgRole !== "owner") {
      res.status(403).json({ error: "Only the organization owner can remove admins." });
      return;
    }

    await db
      .delete(organizationMembers)
      .where(and(eq(organizationMembers.orgId, req.orgId), eq(organizationMembers.userId, targetUserId)));

    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to remove member");
    res.status(500).json({ error: "Failed to remove member" });
  }
});

export default router;
