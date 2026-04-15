import { pgTable, text, serial, integer, timestamp, pgEnum, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { usersTable } from "./users";

export const sosMediaTypeEnum = pgEnum("sos_media_type", ["audio", "video"]);

export const sosRecordingsTable = pgTable("sos_recordings", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => usersTable.id),
  mediaUrl: text("media_url").notNull(),
  mediaType: sosMediaTypeEnum("media_type").notNull().default("audio"),
  duration: integer("duration"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  locationName: text("location_name"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertSosRecordingSchema = createInsertSchema(sosRecordingsTable).omit({
  id: true,
  createdAt: true,
});

export type InsertSosRecording = z.infer<typeof insertSosRecordingSchema>;
export type SosRecording = typeof sosRecordingsTable.$inferSelect;
