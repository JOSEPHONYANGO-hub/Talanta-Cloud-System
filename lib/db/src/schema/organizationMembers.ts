import { pgTable, serial, integer, text, timestamp, unique } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const organizationMembers = pgTable(
  "organization_members",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    userId: text("user_id").notNull(),
    role: text("role", { enum: ["owner", "admin", "member"] })
      .notNull()
      .default("owner"),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
  },
  (t) => ({ unq: unique().on(t.orgId, t.userId) }),
);

export type OrganizationMember = typeof organizationMembers.$inferSelect;
