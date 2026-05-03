import { Router } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { organizations, organizationMembers } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireOrg } from "../middlewares/requireOrg";

const router = Router();

router.get("/organizations/me", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const [membership] = await db
      .select({ orgId: organizationMembers.orgId })
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, userId))
      .limit(1);

    if (!membership) { res.status(404).json({ error: "No organization", code: "NO_ORG" }); return; }

    const [org] = await db
      .select()
      .from(organizations)
      .where(eq(organizations.id, membership.orgId))
      .limit(1);

    if (!org) { res.status(404).json({ error: "Organization not found" }); return; }

    res.json(org);
  } catch (err) {
    req.log.error({ err }, "Failed to get organization");
    res.status(500).json({ error: "Failed to get organization" });
  }
});

router.post("/organizations", async (req, res) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

    const [existing] = await db
      .select({ orgId: organizationMembers.orgId })
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, userId))
      .limit(1);

    if (existing) { res.status(409).json({ error: "User already has an organization" }); return; }

    const { name, slug, logoUrl, primaryColor, accentColor, industry } = req.body ?? {};
    if (!name || typeof name !== "string" || !name.trim()) {
      res.status(400).json({ error: "Organization name is required" }); return;
    }

    const finalSlug = (
      slug || name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    ).slice(0, 50);

    const [slugExists] = await db
      .select({ id: organizations.id })
      .from(organizations)
      .where(eq(organizations.slug, finalSlug))
      .limit(1);

    if (slugExists) {
      res.status(409).json({ error: "That workspace URL is already taken. Try a different one." }); return;
    }

    const [org] = await db
      .insert(organizations)
      .values({
        name: name.trim(),
        slug: finalSlug,
        logoUrl: logoUrl ?? null,
        primaryColor: primaryColor ?? "#6366f1",
        accentColor: accentColor ?? "#10b981",
        industry: industry ?? null,
        ownerId: userId,
      })
      .returning();

    await db.insert(organizationMembers).values({
      orgId: org.id,
      userId,
      role: "owner",
    });

    res.status(201).json(org);
  } catch (err) {
    req.log.error({ err }, "Failed to create organization");
    res.status(500).json({ error: "Failed to create organization" });
  }
});

router.put("/organizations/me", requireOrg, async (req, res) => {
  try {
    const { name, logoUrl, primaryColor, accentColor, industry } = req.body ?? {};

    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (name !== undefined) updates.name = String(name).trim();
    if (logoUrl !== undefined) updates.logoUrl = logoUrl || null;
    if (primaryColor !== undefined) updates.primaryColor = String(primaryColor);
    if (accentColor !== undefined) updates.accentColor = String(accentColor);
    if (industry !== undefined) updates.industry = industry || null;

    const [org] = await db
      .update(organizations)
      .set(updates)
      .where(eq(organizations.id, req.orgId))
      .returning();

    if (!org) { res.status(404).json({ error: "Organization not found" }); return; }

    res.json(org);
  } catch (err) {
    req.log.error({ err }, "Failed to update organization");
    res.status(500).json({ error: "Failed to update organization" });
  }
});

export default router;
