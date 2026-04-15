import { Router, Request, Response } from "express";

// ✅ FIX: use relative paths instead of @workspace
import { db } from "../../../lib/db";
import { usersTable } from "../../../lib/db/schema";

import { eq } from "drizzle-orm";
import {
  signToken,
  hashPassword,
  comparePassword,
  requireAuth,
  type AuthRequest,
} from "../lib/auth.js";
import { z } from "zod";

const router = Router();

const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(5),
  password: z.string().min(6),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

// ✅ REGISTER
router.post("/register", async (req: Request, res: Response) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Validation error",
      message: parsed.error.message,
    });
  }

  const { name, email, phone, password } = parsed.data;

  const existing = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (existing.length > 0) {
    return res.status(409).json({
      error: "Conflict",
      message: "Email already exists",
    });
  }

  const passwordHash = await hashPassword(password);

  const [user] = await db
    .insert(usersTable)
    .values({
      name,
      email,
      phone,
      passwordHash,
      role: "user",
      totalPoints: 0,
    })
    .returning();

  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return res.status(201).json({
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

// ✅ LOGIN
router.post("/login", async (req: Request, res: Response) => {
  const parsed = loginSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      error: "Validation error",
      message: parsed.error.message,
    });
  }

  const { email, password } = parsed.data;

  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.email, email))
    .limit(1);

  if (!user || !(await comparePassword(password, user.passwordHash))) {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Invalid credentials",
    });
  }

  if (user.role !== "user") {
    return res.status(401).json({
      error: "Unauthorized",
      message: "Please use the admin login",
    });
  }

  const token = signToken({
    id: user.id,
    email: user.email,
    role: user.role,
  });

  return res.json({
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

// ✅ LOGOUT
router.post("/logout", requireAuth, (_req: Request, res: Response) => {
  res.json({ message: "Logged out successfully" });
});

// ✅ ME
router.get("/me", requireAuth, async (req: AuthRequest, res: Response) => {
  const [user] = await db
    .select()
    .from(usersTable)
    .where(eq(usersTable.id, req.user!.id))
    .limit(1);

  if (!user) {
    return res.status(404).json({
      error: "Not found",
      message: "User not found",
    });
  }

  return res.json({
    id: user.id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    role: user.role,
    totalPoints: user.totalPoints,
    createdAt: user.createdAt,
  });
});

export default router;