import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { orgInvitations, organizations, organizationMembers } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";

const router = Router();

router.get("/invitations/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const [invite] = await db
      .select({
        id: orgInvitations.id,
        email: orgInvitations.email,
        role: orgInvitations.role,
        expiresAt: orgInvitations.expiresAt,
        acceptedAt: orgInvitations.acceptedAt,
        orgId: orgInvitations.orgId,
        orgName: organizations.name,
        orgSlug: organizations.slug,
        orgPrimaryColor: organizations.primaryColor,
        orgLogoUrl: organizations.logoUrl,
      })
      .from(orgInvitations)
      .innerJoin(organizations, eq(orgInvitations.orgId, organizations.id))
      .where(eq(orgInvitations.token, token))
      .limit(1);

    if (!invite) {
      res.status(404).json({ error: "Invitation not found or invalid." });
      return;
    }

    if (invite.acceptedAt) {
      res.status(410).json({ error: "This invitation has already been accepted.", accepted: true });
      return;
    }

    if (new Date(invite.expiresAt) < new Date()) {
      res.status(410).json({ error: "This invitation has expired." });
      return;
    }

    res.json({
      email: invite.email,
      role: invite.role,
      orgId: invite.orgId,
      orgName: invite.orgName,
      orgSlug: invite.orgSlug,
      orgPrimaryColor: invite.orgPrimaryColor,
      orgLogoUrl: invite.orgLogoUrl,
      expiresAt: invite.expiresAt,
    });
  } catch (err) {
    req.log.error({ err }, "Failed to get invitation");
    res.status(500).json({ error: "Failed to get invitation" });
  }
});

router.post("/invitations/:token/accept", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "You must be signed in to accept an invitation." });
      return;
    }

    const { token } = req.params;

    const [invite] = await db
      .select()
      .from(orgInvitations)
      .where(and(eq(orgInvitations.token, token), isNull(orgInvitations.acceptedAt)))
      .limit(1);

    if (!invite) {
      res.status(404).json({ error: "Invitation not found, invalid, or already accepted." });
      return;
    }

    if (new Date(invite.expiresAt) < new Date()) {
      res.status(410).json({ error: "This invitation has expired." });
      return;
    }

    const existingMembership = await db
      .select({ id: organizationMembers.id })
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, userId))
      .limit(1);

    if (existingMembership.length > 0) {
      res.status(409).json({ error: "You already belong to an organization." });
      return;
    }

    await db
      .update(organizations)
      .set({ ownerId: userId })
      .where(and(eq(organizations.id, invite.orgId), eq(organizations.ownerId, "pending")));

    await db.insert(organizationMembers).values({
      orgId: invite.orgId,
      userId,
      role: invite.role as "owner" | "admin" | "member",
    }).onConflictDoNothing();

    await db
      .update(orgInvitations)
      .set({ acceptedAt: new Date() })
      .where(eq(orgInvitations.token, token));

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, invite.orgId))
      .limit(1);

    res.json({ success: true, org });
  } catch (err) {
    req.log.error({ err }, "Failed to accept invitation");
    res.status(500).json({ error: "Failed to accept invitation" });
  }
});

export default router;
