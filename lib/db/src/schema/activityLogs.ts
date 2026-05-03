import { pgTable, serial, integer, text, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { organizations } from "./organizations";

export const activityLogs = pgTable(
  "activity_logs",
  {
    id: serial("id").primaryKey(),
    orgId: integer("org_id")
      .notNull()
      .references(() => organizations.id, { onDelete: "cascade" }),
    actorUserId: text("actor_user_id").notNull(),
    action: text("action").notNull(),
    entityType: text("entity_type").notNull(),
    entityId: text("entity_id"),
    metadata: jsonb("metadata").notNull().default({}),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => ({ orgIdx: index("activity_logs_org_idx").on(t.orgId), createdIdx: index("activity_logs_created_idx").on(t.createdAt) }),
);

export type ActivityLog = typeof activityLogs.$inferSelect;
