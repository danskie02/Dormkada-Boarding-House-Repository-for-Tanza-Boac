import { Router } from "express";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { db, usersTable } from "@workspace/db";
import { generateToken, requireAuth } from "../middlewares/auth";
import { sendNewOwnerVerificationEmail } from "../lib/email-service";
import { logger } from "../lib/logger";

const router = Router();

router.post("/auth/register", async (req, res): Promise<void> => {
  const { email, fullName, password, role, idImageUrl } = req.body;

  if (!email || !fullName || !password || !role) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  if (!["student", "owner"].includes(role)) {
    res.status(400).json({ error: "Invalid role" });
    return;
  }

  const existing = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing.length > 0) {
    res.status(409).json({ error: "Email already in use" });
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const status = role === "owner" ? "pending" : "active";

  const [user] = await db.insert(usersTable).values({
    email,
    fullName,
    passwordHash,
    role,
    status,
    idImageUrl: idImageUrl ?? null,
  }).returning();

  // Send admin notification if it's a new owner registration
  if (role === "owner" && process.env.ADMIN_EMAIL) {
    sendNewOwnerVerificationEmail(
      process.env.ADMIN_EMAIL,
      fullName,
      email
    ).catch(err => logger.error("Failed to send owner verification email to admin:", err));
  }

  const token = generateToken({ userId: user.id, role: user.role, email: user.email });

  res.status(201).json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      idImageUrl: user.idImageUrl,
      createdAt: user.createdAt.toISOString(),
    },
    token,
  });
});

router.post("/auth/login", async (req, res): Promise<void> => {
  const { email, password } = req.body;

  if (!email || !password) {
    res.status(400).json({ error: "Missing email or password" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (!user) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    res.status(401).json({ error: "Invalid credentials" });
    return;
  }

  const token = generateToken({ userId: user.id, role: user.role, email: user.email });

  res.json({
    user: {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
      idImageUrl: user.idImageUrl,
      createdAt: user.createdAt.toISOString(),
    },
    token,
  });
});

router.post("/auth/logout", (_req, res): Promise<void> => {
  res.json({ success: true });
  return Promise.resolve();
});

router.get("/auth/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId));
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    status: user.status,
    idImageUrl: user.idImageUrl,
    createdAt: user.createdAt.toISOString(),
  });
});

export default router;
