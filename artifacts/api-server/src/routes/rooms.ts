import { Router } from "express";
import { eq, and } from "drizzle-orm";
import { db, roomsTable, boardingHousesTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

// List rooms for a boarding house
router.get("/boarding-houses/:id/rooms", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { type, status } = req.query;

  let rooms = await db.select().from(roomsTable).where(eq(roomsTable.boardingHouseId, id));

  if (type) rooms = rooms.filter(r => r.type === type);
  if (status) rooms = rooms.filter(r => r.status === status);

  res.json(rooms.map(r => ({
    ...r,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
  })));
});

// Create room
router.post("/boarding-houses/:id/rooms", requireAuth, requireRole("owner", "admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const boardingHouseId = parseInt(raw, 10);

  const { name, type, floor, price, totalSlots, amenities, photos, description } = req.body;

  if (!name || !type || price == null || totalSlots == null) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const slots = Number(totalSlots);
  const [room] = await db.insert(roomsTable).values({
    boardingHouseId,
    name,
    type,
    floor: floor ?? null,
    price: Number(price),
    totalSlots: slots,
    availableSlots: slots,
    status: "available",
    amenities: amenities || [],
    photos: photos || [],
    description: description ?? null,
  }).returning();

  // Update boarding house room counts
  const allRooms = await db.select().from(roomsTable).where(eq(roomsTable.boardingHouseId, boardingHouseId));
  const totalRooms = allRooms.length;
  const availableRooms = allRooms.filter(r => r.status !== "full").length;
  await db.update(boardingHousesTable).set({ totalRooms, availableRooms }).where(eq(boardingHousesTable.id, boardingHouseId));

  res.status(201).json({
    ...room,
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
  });
});

// Get room
router.get("/rooms/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, id));
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  res.json({ ...room, createdAt: room.createdAt.toISOString(), updatedAt: room.updatedAt.toISOString() });
});

// Update room
router.patch("/rooms/:id", requireAuth, requireRole("owner", "admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const updateData: Record<string, unknown> = {};
  const fields = ["name", "type", "floor", "price", "totalSlots", "amenities", "photos", "description"];
  for (const field of fields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }
  if (updateData.price) updateData.price = Number(updateData.price);
  if (updateData.totalSlots) updateData.totalSlots = Number(updateData.totalSlots);

  const [room] = await db.update(roomsTable).set(updateData).where(eq(roomsTable.id, id)).returning();
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  res.json({ ...room, createdAt: room.createdAt.toISOString(), updatedAt: room.updatedAt.toISOString() });
});

// Delete room
router.delete("/rooms/:id", requireAuth, requireRole("owner", "admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  await db.delete(roomsTable).where(eq(roomsTable.id, id));
  res.sendStatus(204);
});

export default router;
