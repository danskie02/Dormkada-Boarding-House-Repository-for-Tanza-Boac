import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, boardingHousesTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

function serializeUser(u: typeof usersTable.$inferSelect) {
  return {
    id: u.id,
    email: u.email,
    fullName: u.fullName,
    role: u.role,
    status: u.status,
    idImageUrl: u.idImageUrl,
    createdAt: u.createdAt.toISOString(),
  };
}

function serializeBH(bh: typeof boardingHousesTable.$inferSelect) {
  return {
    ...bh,
    createdAt: bh.createdAt.toISOString(),
    updatedAt: bh.updatedAt.toISOString(),
    ownerName: null,
  };
}

// List pending owners
router.get("/admin/pending-owners", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const owners = await db.select().from(usersTable)
    .where(eq(usersTable.role, "owner"));

  res.json(owners.filter(u => u.status === "pending").map(serializeUser));
});

// Verify owner
router.post("/admin/users/:id/verify", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [user] = await db.update(usersTable)
    .set({ status: "active" })
    .where(eq(usersTable.id, id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(serializeUser(user));
});

// Suspend user
router.post("/admin/users/:id/suspend", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [user] = await db.update(usersTable)
    .set({ status: "suspended" })
    .where(eq(usersTable.id, id))
    .returning();

  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }

  res.json(serializeUser(user));
});

// List pending listings
router.get("/admin/listings", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const listings = await db.select().from(boardingHousesTable)
    .where(eq(boardingHousesTable.status, "pending"));

  res.json(listings.map(serializeBH));
});

// Approve listing
router.post("/admin/listings/:id/approve", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [bh] = await db.update(boardingHousesTable)
    .set({ status: "approved" })
    .where(eq(boardingHousesTable.id, id))
    .returning();

  if (!bh) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  res.json(serializeBH(bh));
});

// Reject listing
router.post("/admin/listings/:id/reject", requireAuth, requireRole("admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [bh] = await db.update(boardingHousesTable)
    .set({ status: "rejected" })
    .where(eq(boardingHousesTable.id, id))
    .returning();

  if (!bh) {
    res.status(404).json({ error: "Listing not found" });
    return;
  }

  res.json(serializeBH(bh));
});

export default router;
