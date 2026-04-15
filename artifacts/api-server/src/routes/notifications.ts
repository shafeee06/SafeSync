import { Router } from "express";
import { db } from "@workspace/db";
import { notificationsTable } from "@workspace/db/schema";
import { eq, and, desc, count } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth.js";

const router = Router();

router.get("/", requireAuth, async (req: AuthRequest, res) => {
  const unreadOnly = req.query.unreadOnly === "true";
  const conditions = [eq(notificationsTable.userId, req.user!.id)];
  if (unreadOnly) {
    conditions.push(eq(notificationsTable.isRead, false));
  }
  const whereClause = and(...conditions);

  const [notifications, totalResult, unreadResult] = await Promise.all([
    db.select().from(notificationsTable).where(whereClause).orderBy(desc(notificationsTable.createdAt)),
    db.select({ count: count() }).from(notificationsTable).where(eq(notificationsTable.userId, req.user!.id)),
    db.select({ count: count() }).from(notificationsTable)
      .where(and(eq(notificationsTable.userId, req.user!.id), eq(notificationsTable.isRead, false))),
  ]);

  res.json({
    notifications,
    total: totalResult[0].count,
    unreadCount: unreadResult[0].count,
  });
});

router.patch("/:id/read", requireAuth, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const [notification] = await db.update(notificationsTable)
    .set({ isRead: true })
    .where(and(eq(notificationsTable.id, id), eq(notificationsTable.userId, req.user!.id)))
    .returning();

  if (!notification) {
    res.status(404).json({ error: "Not found", message: "Notification not found" });
    return;
  }
  res.json(notification);
});

export default router;
