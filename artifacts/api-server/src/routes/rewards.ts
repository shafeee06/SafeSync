import { Router } from "express";
import { db } from "@workspace/db";
import { usersTable, rewardHistoryTable, complaintsTable } from "@workspace/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth.js";

const router = Router();

router.get("/summary", requireAuth, async (req: AuthRequest, res) => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.id)).limit(1);

  const history = await db
    .select({
      complaintId: complaintsTable.complaintId,
      complaintTitle: complaintsTable.title,
      points: rewardHistoryTable.points,
      reason: rewardHistoryTable.reason,
      createdAt: rewardHistoryTable.createdAt,
    })
    .from(rewardHistoryTable)
    .leftJoin(complaintsTable, eq(rewardHistoryTable.complaintId, complaintsTable.id))
    .where(eq(rewardHistoryTable.userId, req.user!.id))
    .orderBy(rewardHistoryTable.createdAt);

  res.json({
    totalPoints: user?.totalPoints ?? 0,
    history: history.map((h) => ({
      complaintId: h.complaintId ?? "",
      complaintTitle: h.complaintTitle ?? "",
      points: h.points,
      reason: h.reason,
      createdAt: h.createdAt,
    })),
  });
});

export default router;
