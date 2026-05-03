import type { RequestHandler } from "express";

const ROLE_LEVELS: Record<string, number> = {
  member: 1,
  admin: 2,
  owner: 3,
};

export function requireRole(minRole: "member" | "admin" | "owner"): RequestHandler {
  return (req, res, next) => {
    const userLevel = ROLE_LEVELS[req.orgRole ?? ""] ?? 0;
    const required = ROLE_LEVELS[minRole];
    if (userLevel < required) {
      res.status(403).json({
        error: `Requires ${minRole} role or higher`,
        code: "INSUFFICIENT_ROLE",
        yourRole: req.orgRole ?? "none",
      });
      return;
    }
    next();
  };
}
