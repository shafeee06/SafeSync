import { Router } from "express";
import { db } from "@workspace/db";
import { sosRecordingsTable } from "@workspace/db/schema";
import { eq, desc, count } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth.js";
import { z } from "zod";

const router = Router();

const createSosSchema = z.object({
  mediaUrl: z.string().min(1),
  mediaType: z.enum(["audio", "video"]),
  duration: z.number().int().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  locationName: z.string().optional().nullable(),
});

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const recordings = await db.select()
    .from(sosRecordingsTable)
    .where(eq(sosRecordingsTable.userId, req.user!.id))
    .orderBy(desc(sosRecordingsTable.createdAt));

  const [totalResult] = await db.select({ count: count() })
    .from(sosRecordingsTable)
    .where(eq(sosRecordingsTable.userId, req.user!.id));

  res.json({ recordings, total: totalResult.count });
});

router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const parsed = createSosSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const data = parsed.data;
  const [recording] = await db.insert(sosRecordingsTable).values({
    userId: req.user!.id,
    mediaUrl: data.mediaUrl,
    mediaType: data.mediaType,
    duration: data.duration ?? null,
    latitude: data.latitude ?? null,
    longitude: data.longitude ?? null,
    locationName: data.locationName ?? null,
  }).returning();

  res.status(201).json(recording);
});

export default router;
