import { Router } from "express";
import { db } from "@workspace/db";
import { complaintsTable, notificationsTable, auditLogsTable } from "@workspace/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth, type AuthRequest } from "../lib/auth.js";
import { z } from "zod";
import cloudinary from "../config/cloudinary";

const router = Router();

function generateComplaintId() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `SS-${timestamp}-${random}`;
}

function autoVerify(title: string, description: string, mediaUrl?: string | null, latitude?: number | null) {
  let score = 40;
  if (mediaUrl) score += 25;
  if (latitude) score += 15;
  if (description.length > 50) score += 10;
  if (title.length > 10) score += 10;
  const status = score >= 60 ? "verified" : "flagged";
  return { score, status };
}

function suggestDepartment(title: string, description: string): string {
  const text = (title + " " + description).toLowerCase();
  if (/pothole|road|street|pavement|traffic|bridge|sidewalk/.test(text)) return "roads";
  if (/water|pipe|leak|flood|sewage|drain|plumbing/.test(text)) return "water";
  if (/power|electric|light|outage|wire|cable|transformer/.test(text)) return "electricity";
  if (/garbage|waste|trash|sewage|smell|rats|rubbish/.test(text)) return "sanitation";
  return "general";
}

const createComplaintSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  mediaUrl: z.string().optional().nullable(),
  mediaType: z.enum(["image", "video"]).optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  locationName: z.string().optional().nullable(),
  deviceInfo: z.string().optional().nullable(),
  urgency: z.enum(["low", "medium", "high"]).default("medium"),
});


// ✅ GET ALL COMPLAINTS (FIXED)
 router.get("/", requireAuth, async (req: AuthRequest, res) => {
  try {
    const complaints = await db
      .select()
      .from(complaintsTable)
      .where(eq(complaintsTable.userId, req.user!.id))
      .orderBy(desc(complaintsTable.createdAt));
      console.log("Fetched complaints for user:", req.user!.email, "Count:", complaints.length)

    return res.json({
      complaints: complaints || [],
    });

  } catch (err: any) {
    console.error("GET ERROR:", err);
    return res.status(500).json({
      error: "Failed to fetch complaints",
      message: err.message,
    });
  }
}); 
router.get("/:id", requireAuth, async (req: AuthRequest, res) => {
  try {
    const id = parseInt(req.params.id);

    const [complaint] = await db
      .select()
      .from(complaintsTable)
      .where(eq(complaintsTable.id, id))
      .limit(1);

    if (!complaint) {
      return res.status(404).json({
        error: "Not found",
        message: "Complaint not found",
      });
    }

    // OPTIONAL: restrict to owner
    if (complaint.userId !== req.user!.id) {
      return res.status(403).json({
        error: "Forbidden",
        message: "You cannot access this complaint",
      });
    }

    res.json(complaint);
  } catch (err: any) {
    console.error("GET BY ID ERROR:", err);
    res.status(500).json({
      error: "Failed to fetch complaint",
      message: err.message,
    });
  }
});


// ✅ CREATE COMPLAINT
router.post("/", requireAuth, async (req: AuthRequest, res) => {
  const parsed = createComplaintSchema.safeParse(req.body);

  if (!parsed.success) {
    return res.status(400).json({
      error: "Validation error",
      message: parsed.error.message,
    });
  }

  const data = parsed.data;

  let uploadedUrl: string | null = null;

  // ✅ Upload to Cloudinary
  if (data.mediaUrl) {
    try {
      const uploadRes = await cloudinary.uploader.upload(data.mediaUrl, {
        folder: "safesync/complaints",
        resource_type: "auto",
      });

      uploadedUrl = uploadRes.secure_url;
    } catch (err) {
      console.error("Cloudinary Upload Error:", err);
      return res.status(500).json({
        error: "Upload failed",
      });
    }
  }

  const complaintId = generateComplaintId();

  const { score, status: verificationStatus } = autoVerify(
    data.title,
    data.description,
    uploadedUrl,
    data.latitude
  );

  const department = suggestDepartment(data.title, data.description);

  const slaHours =
    data.urgency === "high" ? 24 : data.urgency === "medium" ? 48 : 72;

  const slaDeadline = new Date(Date.now() + slaHours * 60 * 60 * 1000);

  try {
    const [complaint] = await db.insert(complaintsTable).values({
      complaintId,
      userId: req.user!.id,
      title: data.title,
      description: data.description,
      mediaUrl: uploadedUrl,
      mediaType: (data.mediaType as any) ?? null,
      latitude: data.latitude ?? null,
      longitude: data.longitude ?? null,
      locationName: data.locationName ?? null,
      deviceInfo: data.deviceInfo ?? null,
      urgency: data.urgency,
      status: "pending",
      department: department as any,
      verificationScore: score,
      verificationStatus: verificationStatus as any,
      slaDeadline,
      hasBlackMark: false,
      earnedPoints: 0,
    }).returning();

    // 🔔 Notification
    await db.insert(notificationsTable).values({
      userId: req.user!.id,
      title: "Complaint Submitted",
      message: `Complaint ID: ${complaintId}`,
      type: "complaint_submitted",
      isRead: false,
      relatedId: complaint.id,
    });

    // ✅ Verified logic
    if (verificationStatus === "verified") {
      await db.update(complaintsTable)
        .set({ status: "verified" })
        .where(eq(complaintsTable.id, complaint.id));
    }

    // 🧾 Audit log
    await db.insert(auditLogsTable).values({
      entityType: "complaint",
      entityId: complaint.id,
      action: "created",
      performedBy: req.user!.email,
      details: `Complaint ${complaintId} created`,
    });

    return res.status(201).json({
      ...complaint,
      status: verificationStatus === "verified" ? "verified" : "pending",
    });

  } catch (err: any) {
    console.error("DB ERROR:", err);
    return res.status(500).json({
      error: "Database error",
      message: err.message,
    });
  }
});

export default router;