import { Router } from "express";
import { db } from "@workspace/db";
import {
  complaintsTable,
  usersTable,
  auditLogsTable,
  notificationsTable,
  rewardHistoryTable,
} from "@workspace/db/schema";
import { eq, and, desc, count, sql } from "drizzle-orm";
import { requireAdmin, requireAuth, comparePassword, signToken, type AuthRequest } from "../lib/auth.js";
import { z } from "zod";

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post("/login", async (req, res) => {
  const parsed = loginSchema.safeParse(req.body);
  console.log("Admin login attempt:", parsed)
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const { email, password } = parsed.data;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email)).limit(1);

  if (!user || !(await comparePassword(password, user.passwordHash))) {
    res.status(401).json({ error: "Unauthorized", message: "Invalid credentials" });
    return;
  }

  if (user.role !== "admin") {
    res.status(401).json({ error: "Unauthorized", message: "Admin access required" });
    return;
  }

  const token = signToken({ id: user.id, email: user.email, role: user.role });
  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      totalPoints: user.totalPoints,
      createdAt: user.createdAt,
    },
  });
});

router.get("/complaints", requireAdmin, async (req: AuthRequest, res) => {
  const status = req.query.status as string | undefined;
  const department = req.query.department as string | undefined;
  const hasBlackMark = req.query.hasBlackMark as string | undefined;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const offset = (page - 1) * limit;

  const conditions: any[] = [];
  if (status && ["pending", "verified", "in_progress", "resolved", "flagged"].includes(status)) {
    conditions.push(eq(complaintsTable.status, status as any));
  }
  if (department) {
    conditions.push(eq(complaintsTable.department, department as any));
  }
  if (hasBlackMark === "true") {
    conditions.push(eq(complaintsTable.hasBlackMark, true));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const query = db
    .select({
      id: complaintsTable.id,
      complaintId: complaintsTable.complaintId,
      userId: complaintsTable.userId,
      title: complaintsTable.title,
      description: complaintsTable.description,
      mediaUrl: complaintsTable.mediaUrl,
      mediaType: complaintsTable.mediaType,
      latitude: complaintsTable.latitude,
      longitude: complaintsTable.longitude,
      locationName: complaintsTable.locationName,
      deviceInfo: complaintsTable.deviceInfo,
      urgency: complaintsTable.urgency,
      status: complaintsTable.status,
      department: complaintsTable.department,
      verificationScore: complaintsTable.verificationScore,
      verificationStatus: complaintsTable.verificationStatus,
      earnedPoints: complaintsTable.earnedPoints,
      hasBlackMark: complaintsTable.hasBlackMark,
      slaDeadline: complaintsTable.slaDeadline,
      resolvedAt: complaintsTable.resolvedAt,
      createdAt: complaintsTable.createdAt,
      updatedAt: complaintsTable.updatedAt,
      userName: usersTable.name,
      userEmail: usersTable.email,
      userPhone: usersTable.phone,
    })
    .from(complaintsTable)
    .leftJoin(usersTable, eq(complaintsTable.userId, usersTable.id));

  const [complaints, totalResult] = await Promise.all([
    whereClause
      ? query.where(whereClause).orderBy(desc(complaintsTable.createdAt)).limit(limit).offset(offset)
      : query.orderBy(desc(complaintsTable.createdAt)).limit(limit).offset(offset),
    whereClause
      ? db.select({ count: count() }).from(complaintsTable).where(whereClause)
      : db.select({ count: count() }).from(complaintsTable),
  ]);

  res.json({ complaints, total: totalResult[0].count, page, limit });
});

router.get("/complaints/:id", requireAdmin, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const [complaint] = await db
    .select({
      id: complaintsTable.id,
      complaintId: complaintsTable.complaintId,
      userId: complaintsTable.userId,
      title: complaintsTable.title,
      description: complaintsTable.description,
      mediaUrl: complaintsTable.mediaUrl,
      mediaType: complaintsTable.mediaType,
      latitude: complaintsTable.latitude,
      longitude: complaintsTable.longitude,
      locationName: complaintsTable.locationName,
      deviceInfo: complaintsTable.deviceInfo,
      urgency: complaintsTable.urgency,
      status: complaintsTable.status,
      department: complaintsTable.department,
      verificationScore: complaintsTable.verificationScore,
      verificationStatus: complaintsTable.verificationStatus,
      earnedPoints: complaintsTable.earnedPoints,
      hasBlackMark: complaintsTable.hasBlackMark,
      slaDeadline: complaintsTable.slaDeadline,
      resolvedAt: complaintsTable.resolvedAt,
      createdAt: complaintsTable.createdAt,
      updatedAt: complaintsTable.updatedAt,
      userName: usersTable.name,
      userEmail: usersTable.email,
      userPhone: usersTable.phone,
    })
    .from(complaintsTable)
    .leftJoin(usersTable, eq(complaintsTable.userId, usersTable.id))
    .where(eq(complaintsTable.id, id))
    .limit(1);

  if (!complaint) {
    res.status(404).json({ error: "Not found", message: "Complaint not found" });
    return;
  }
  res.json(complaint);
});

const assignSchema = z.object({
  department: z.enum(["roads", "water", "electricity", "sanitation", "general"]),
  status: z.enum(["pending", "verified", "in_progress", "resolved", "flagged"]),
  slaHours: z.number().int().optional().nullable(),
});

router.patch("/complaints/:id/assign", requireAdmin, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const parsed = assignSchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const { department, status, slaHours } = parsed.data;

  const [existing] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, id)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Not found", message: "Complaint not found" });
    return;
  }

  const updateData: any = {
    department,
    status,
    updatedAt: new Date(),
  };

  if (slaHours) {
    updateData.slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);
  }

  if (status === "in_progress" && existing.status !== "in_progress") {
    let points = 10;
    if (existing.urgency === "high") points += 5;
    else if (existing.urgency === "medium") points += 2;
    if (existing.verificationScore && existing.verificationScore >= 80) points += 5;
    else if (existing.verificationScore && existing.verificationScore >= 60) points += 2;
    updateData.earnedPoints = points;

    await db.update(usersTable)
      .set({ totalPoints: sql`total_points + ${points}` })
      .where(eq(usersTable.id, existing.userId));

    await db.insert(rewardHistoryTable).values({
      userId: existing.userId,
      complaintId: existing.id,
      points,
      reason: `Complaint "${existing.title}" routed to ${department} department`,
    });

    await db.insert(notificationsTable).values([
      {
        userId: existing.userId,
        title: "Complaint In Progress",
        message: `Your complaint "${existing.title}" is now being addressed by the ${department.charAt(0).toUpperCase() + department.slice(1)} department.`,
        type: "complaint_routed",
        isRead: false,
        relatedId: existing.id,
      },
      {
        userId: existing.userId,
        title: "Civic Points Awarded 🏆",
        message: `You earned ${points} civic points for your complaint "${existing.title}" (Base: 10, Urgency bonus: ${existing.urgency === "high" ? 5 : existing.urgency === "medium" ? 2 : 0}, Confidence bonus: ${existing.verificationScore && existing.verificationScore >= 80 ? 5 : existing.verificationScore && existing.verificationScore >= 60 ? 2 : 0}).`,
        type: "points_awarded",
        isRead: false,
        relatedId: existing.id,
      },
    ]);
  }

  if (status === "resolved" && existing.status !== "resolved") {
    updateData.resolvedAt = new Date();

    const bonusPoints = 5;
    await db.update(usersTable)
      .set({ totalPoints: sql`total_points + ${bonusPoints}` })
      .where(eq(usersTable.id, existing.userId));

    await db.insert(rewardHistoryTable).values({
      userId: existing.userId,
      complaintId: existing.id,
      points: bonusPoints,
      reason: `Complaint "${existing.title}" resolved — completion bonus`,
    });

    await db.insert(notificationsTable).values([
      {
        userId: existing.userId,
        title: "Complaint Resolved ✅",
        message: `Your complaint "${existing.title}" has been fully resolved!`,
        type: "complaint_resolved",
        isRead: false,
        relatedId: existing.id,
      },
      {
        userId: existing.userId,
        title: "Completion Bonus +5 Points 🎉",
        message: `You earned an additional 5 bonus points for the resolution of "${existing.title}".`,
        type: "points_awarded",
        isRead: false,
        relatedId: existing.id,
      },
    ]);
  }

  const [updated] = await db.update(complaintsTable)
    .set(updateData)
    .where(eq(complaintsTable.id, id))
    .returning();

  await db.insert(auditLogsTable).values({
    entityType: "complaint",
    entityId: id,
    action: `status_updated_to_${status}`,
    performedBy: req.user!.email,
    details: `Assigned to ${department} department, status: ${status}`,
  });

  const [user] = await db.select({ name: usersTable.name, email: usersTable.email, phone: usersTable.phone })
    .from(usersTable).where(eq(usersTable.id, updated.userId)).limit(1);

  res.json({ ...updated, userName: user?.name ?? "", userEmail: user?.email ?? "", userPhone: user?.phone ?? "" });
});

const verifySchema = z.object({
  verificationScore: z.number().int().min(0).max(100),
  verificationStatus: z.enum(["verified", "flagged"]),
});

router.patch("/complaints/:id/verify", requireAdmin, async (req: AuthRequest, res) => {
  const id = parseInt(req.params.id);
  const parsed = verifySchema.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Validation error", message: parsed.error.message });
    return;
  }

  const { verificationScore, verificationStatus } = parsed.data;

  const [existing] = await db.select().from(complaintsTable).where(eq(complaintsTable.id, id)).limit(1);
  if (!existing) {
    res.status(404).json({ error: "Not found" });
    return;
  }

  const newStatus = verificationStatus === "verified" ? "verified" : "flagged";
  const [updated] = await db.update(complaintsTable)
    .set({ verificationScore, verificationStatus, status: newStatus as any, updatedAt: new Date() })
    .where(eq(complaintsTable.id, id))
    .returning();

  await db.insert(notificationsTable).values({
    userId: existing.userId,
    title: verificationStatus === "verified" ? "Complaint Verified ✅" : "Complaint Flagged ⚠️",
    message: `Your complaint "${existing.title}" received a verification score of ${verificationScore}%.`,
    type: "complaint_verified",
    isRead: false,
    relatedId: id,
  });

  await db.insert(auditLogsTable).values({
    entityType: "complaint",
    entityId: id,
    action: `manually_${verificationStatus}`,
    performedBy: req.user!.email,
    details: `Verification score: ${verificationScore}%, status: ${verificationStatus}`,
  });

  const [user] = await db.select({ name: usersTable.name, email: usersTable.email, phone: usersTable.phone })
    .from(usersTable).where(eq(usersTable.id, updated.userId)).limit(1);

  res.json({ ...updated, userName: user?.name ?? "", userEmail: user?.email ?? "", userPhone: user?.phone ?? "" });
});

router.get("/stats", requireAdmin, async (_req, res) => {
  const [
    totalResult,
    pendingResult,
    resolvedResult,
    verifiedResult,
    inProgressResult,
    flaggedResult,
    blackMarksResult,
    usersResult,
  ] = await Promise.all([
    db.select({ count: count() }).from(complaintsTable),
    db.select({ count: count() }).from(complaintsTable).where(eq(complaintsTable.status, "pending")),
    db.select({ count: count() }).from(complaintsTable).where(eq(complaintsTable.status, "resolved")),
    db.select({ count: count() }).from(complaintsTable).where(eq(complaintsTable.status, "verified")),
    db.select({ count: count() }).from(complaintsTable).where(eq(complaintsTable.status, "in_progress")),
    db.select({ count: count() }).from(complaintsTable).where(eq(complaintsTable.status, "flagged")),
    db.select({ count: count() }).from(complaintsTable).where(eq(complaintsTable.hasBlackMark, true)),
    db.select({ count: count() }).from(usersTable).where(eq(usersTable.role, "user")),
  ]);

  const deptStats = await db
    .select({
      department: complaintsTable.department,
      total: count(),
    })
    .from(complaintsTable)
    .groupBy(complaintsTable.department);

  const deptResolved = await db
    .select({
      department: complaintsTable.department,
      resolved: count(),
    })
    .from(complaintsTable)
    .where(eq(complaintsTable.status, "resolved"))
    .groupBy(complaintsTable.department);

  const deptBlackMarks = await db
    .select({
      department: complaintsTable.department,
      blackMarks: count(),
    })
    .from(complaintsTable)
    .where(eq(complaintsTable.hasBlackMark, true))
    .groupBy(complaintsTable.department);

  const deptDelayed = await db
    .select({
      department: complaintsTable.department,
      delayed: count(),
    })
    .from(complaintsTable)
    .where(and(eq(complaintsTable.hasBlackMark, true)))
    .groupBy(complaintsTable.department);

  const departments = ["roads", "water", "electricity", "sanitation", "general"];
  const departmentStats = departments.map((dept) => ({
    department: dept,
    total: deptStats.find((d) => d.department === dept)?.total ?? 0,
    resolved: deptResolved.find((d) => d.department === dept)?.resolved ?? 0,
    delayed: deptDelayed.find((d) => d.department === dept)?.delayed ?? 0,
    blackMarks: deptBlackMarks.find((d) => d.department === dept)?.blackMarks ?? 0,
  }));

  res.json({
    totalComplaints: totalResult[0].count,
    pendingComplaints: pendingResult[0].count,
    resolvedComplaints: resolvedResult[0].count,
    verifiedComplaints: verifiedResult[0].count,
    inProgressComplaints: inProgressResult[0].count,
    flaggedComplaints: flaggedResult[0].count,
    blackMarksCount: blackMarksResult[0].count,
    totalUsers: usersResult[0].count,
    departmentStats,
  });
});

router.get("/audit-logs", requireAdmin, async (req: AuthRequest, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 50;
  const offset = (page - 1) * limit;

  const [logs, totalResult] = await Promise.all([
    db.select().from(auditLogsTable).orderBy(desc(auditLogsTable.createdAt)).limit(limit).offset(offset),
    db.select({ count: count() }).from(auditLogsTable),
  ]);

  res.json({ logs, total: totalResult[0].count, page, limit });
});

export default router;
