import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const orgInvitations = pgTable("org_invitations", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id")
    .notNull()
    .references(() => organizations.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  role: text("role", { enum: ["owner", "admin", "member"] })
    .notNull()
    .default("owner"),
  token: text("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  acceptedAt: timestamp("accepted_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type OrgInvitation = typeof orgInvitations.$inferSelect;
