import type { RequestHandler } from "express";
import { getAuth } from "@clerk/express";

export const requireSuperAdmin: RequestHandler = (req, res, next) => {
  const { userId } = getAuth(req);
  if (!userId) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const superAdminIds = (process.env.SUPER_ADMIN_USER_IDS ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

  if (!superAdminIds.length || !superAdminIds.includes(userId)) {
    res.status(403).json({ error: "Super admin access required", code: "NOT_SUPER_ADMIN" });
    return;
  }

  next();
};
