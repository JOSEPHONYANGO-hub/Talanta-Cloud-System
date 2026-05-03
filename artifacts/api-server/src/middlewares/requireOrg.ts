import type { RequestHandler } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import { organizationMembers } from "@workspace/db";
import { eq } from "drizzle-orm";

export const requireOrg: RequestHandler = async (req, res, next) => {
  try {
    const { userId } = getAuth(req);
    if (!userId) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const [membership] = await db
      .select({ orgId: organizationMembers.orgId, role: organizationMembers.role })
      .from(organizationMembers)
      .where(eq(organizationMembers.userId, userId))
      .limit(1);

    if (!membership) {
      res.status(403).json({ error: "No organization found", code: "NO_ORG" });
      return;
    }

    req.orgId = membership.orgId;
    req.orgRole = membership.role;
    next();
  } catch (err) {
    next(err);
  }
};
