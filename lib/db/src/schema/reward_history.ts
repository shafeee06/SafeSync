import { pgTable, text, serial, integer, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";
import { complaintsTable } from "./complaints";

export const rewardHistoryTable = pgTable("reward_history", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  complaintId: integer("complaint_id")
    .notNull()
    .references(() => complaintsTable.id),
  points: integer("points").notNull(),
  reason: text("reason").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertRewardHistorySchema = createInsertSchema(rewardHistoryTable).omit({
  id: true,
  createdAt: true,
});

export type InsertRewardHistory = z.infer<typeof insertRewardHistorySchema>;
export type RewardHistory = typeof rewardHistoryTable.$inferSelect;
