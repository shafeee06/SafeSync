import { pgTable, text, serial, integer, timestamp, pgEnum, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const complaintStatusEnum = pgEnum("complaint_status", [
  "pending",
  "verified",
  "in_progress",
  "resolved",
  "flagged",
]);

export const departmentEnum = pgEnum("department", [
  "roads",
  "water",
  "electricity",
  "sanitation",
  "general",
]);

export const urgencyEnum = pgEnum("urgency", ["low", "medium", "high"]);

export const verificationStatusEnum = pgEnum("verification_status", [
  "unverified",
  "verified",
  "flagged",
]);

export const mediaTypeEnum = pgEnum("media_type", ["image", "video"]);

export const complaintsTable = pgTable("complaints", {
  id: serial("id").primaryKey(),
  complaintId: text("complaint_id").notNull().unique(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  title: text("title").notNull(),
  description: text("description").notNull(),
  mediaUrl: text("media_url"),
  mediaType: mediaTypeEnum("media_type"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  locationName: text("location_name"),
  deviceInfo: text("device_info"),
  urgency: urgencyEnum("urgency").notNull().default("medium"),
  status: complaintStatusEnum("status").notNull().default("pending"),
  department: departmentEnum("department"),
  verificationScore: integer("verification_score"),
  verificationStatus: verificationStatusEnum("verification_status").default("unverified"),
  earnedPoints: integer("earned_points").default(0),
  hasBlackMark: boolean("has_black_mark").notNull().default(false),
  slaDeadline: timestamp("sla_deadline"),
  resolvedAt: timestamp("resolved_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertComplaintSchema = createInsertSchema(complaintsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertComplaint = z.infer<typeof insertComplaintSchema>;
export type Complaint = typeof complaintsTable.$inferSelect;
