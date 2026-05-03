import { pgTable, serial, text, integer, date, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { departments } from "./departments";
import { branches } from "./branches";
import { organizations } from "./organizations";

export const employees = pgTable("employees", {
  id: serial("id").primaryKey(),
  orgId: integer("org_id").references(() => organizations.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  jobTitle: text("job_title").notNull(),
  departmentId: integer("department_id")
    .notNull()
    .references(() => departments.id),
  branchId: integer("branch_id")
    .notNull()
    .references(() => branches.id),
  phone: text("phone").notNull(),
  email: text("email").notNull(),
  dateOfEmployment: date("date_of_employment").notNull(),
  status: text("status", { enum: ["active", "inactive"] }).notNull().default("active"),
  photoUrl: text("photo_url"),
  summary: text("summary"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertEmployeeSchema = createInsertSchema(employees).omit({
  id: true,
  orgId: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertEmployee = z.infer<typeof insertEmployeeSchema>;
export type Employee = typeof employees.$inferSelect;
