import { Router } from "express";
import { eq, or } from "drizzle-orm";
import { db, reservationsTable, roomsTable, boardingHousesTable, usersTable, tenantsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

function serializeReservation(r: typeof reservationsTable.$inferSelect & {
  studentName?: string | null;
  roomName?: string | null;
  boardingHouseName?: string | null;
  price?: number | null;
}) {
  return {
    id: r.id,
    studentId: r.studentId,
    roomId: r.roomId,
    boardingHouseId: r.boardingHouseId,
    status: r.status,
    flagged: r.flagged,
    expiresAt: r.expiresAt?.toISOString() ?? null,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    studentName: r.studentName ?? null,
    roomName: r.roomName ?? null,
    boardingHouseName: r.boardingHouseName ?? null,
    price: r.price ?? null,
  };
}

// List reservations for current user (student sees own, owner sees for their properties)
router.get("/reservations", requireAuth, async (req, res): Promise<void> => {
  const { userId, role } = req.user!;

  const reservations = await db
    .select({
      id: reservationsTable.id,
      studentId: reservationsTable.studentId,
      roomId: reservationsTable.roomId,
      boardingHouseId: reservationsTable.boardingHouseId,
      status: reservationsTable.status,
      flagged: reservationsTable.flagged,
      expiresAt: reservationsTable.expiresAt,
      createdAt: reservationsTable.createdAt,
      updatedAt: reservationsTable.updatedAt,
      studentName: usersTable.fullName,
      roomName: roomsTable.name,
      boardingHouseName: boardingHousesTable.name,
      price: roomsTable.price,
    })
    .from(reservationsTable)
    .leftJoin(usersTable, eq(reservationsTable.studentId, usersTable.id))
    .leftJoin(roomsTable, eq(reservationsTable.roomId, roomsTable.id))
    .leftJoin(boardingHousesTable, eq(reservationsTable.boardingHouseId, boardingHousesTable.id))
    .where(
      role === "student"
        ? eq(reservationsTable.studentId, userId)
        : eq(boardingHousesTable.ownerId, userId)
    );

  // Auto-flag reservations over 24 hours pending
  const now = new Date();
  const toUpdate: number[] = [];
  for (const r of reservations) {
    if (r.status === "pending" && r.expiresAt && r.expiresAt < now && !r.flagged) {
      toUpdate.push(r.id);
    }
  }
  if (toUpdate.length > 0) {
    for (const id of toUpdate) {
      await db.update(reservationsTable).set({ flagged: true }).where(eq(reservationsTable.id, id));
    }
  }

  res.json(reservations.map(serializeReservation));
});

// Create reservation (student only)
router.post("/reservations", requireAuth, requireRole("student"), async (req, res): Promise<void> => {
  const { roomId } = req.body;

  if (!roomId) {
    res.status(400).json({ error: "roomId is required" });
    return;
  }

  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, Number(roomId)));
  if (!room) {
    res.status(404).json({ error: "Room not found" });
    return;
  }

  if (room.status === "full") {
    res.status(400).json({ error: "Room is fully booked" });
    return;
  }

  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const [reservation] = await db.insert(reservationsTable).values({
    studentId: req.user!.userId,
    roomId: room.id,
    boardingHouseId: room.boardingHouseId,
    status: "pending",
    flagged: false,
    expiresAt,
  }).returning();

  res.status(201).json(serializeReservation({
    ...reservation,
    studentName: null,
    roomName: room.name,
    boardingHouseName: null,
    price: room.price,
  }));
});

// Get reservation
router.get("/reservations/:id", requireAuth, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [r] = await db
    .select({
      id: reservationsTable.id,
      studentId: reservationsTable.studentId,
      roomId: reservationsTable.roomId,
      boardingHouseId: reservationsTable.boardingHouseId,
      status: reservationsTable.status,
      flagged: reservationsTable.flagged,
      expiresAt: reservationsTable.expiresAt,
      createdAt: reservationsTable.createdAt,
      updatedAt: reservationsTable.updatedAt,
      studentName: usersTable.fullName,
      roomName: roomsTable.name,
      boardingHouseName: boardingHousesTable.name,
      price: roomsTable.price,
    })
    .from(reservationsTable)
    .leftJoin(usersTable, eq(reservationsTable.studentId, usersTable.id))
    .leftJoin(roomsTable, eq(reservationsTable.roomId, roomsTable.id))
    .leftJoin(boardingHousesTable, eq(reservationsTable.boardingHouseId, boardingHousesTable.id))
    .where(eq(reservationsTable.id, id));

  if (!r) {
    res.status(404).json({ error: "Reservation not found" });
    return;
  }

  res.json(serializeReservation(r));
});

// Accept reservation (owner)
router.post("/reservations/:id/accept", requireAuth, requireRole("owner", "admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [reservation] = await db.select().from(reservationsTable).where(eq(reservationsTable.id, id));
  if (!reservation) {
    res.status(404).json({ error: "Reservation not found" });
    return;
  }

  const [updated] = await db.update(reservationsTable)
    .set({ status: "accepted", flagged: false })
    .where(eq(reservationsTable.id, id))
    .returning();

  // Decrement available slots
  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, reservation.roomId));
  if (room) {
    const newAvailable = Math.max(0, room.availableSlots - 1);
    const newStatus = newAvailable === 0 ? "full" : newAvailable === 1 ? "almost_full" : "available";
    await db.update(roomsTable).set({ availableSlots: newAvailable, status: newStatus }).where(eq(roomsTable.id, room.id));

    // Update boarding house available rooms
    const allRooms = await db.select().from(roomsTable).where(eq(roomsTable.boardingHouseId, room.boardingHouseId));
    const availableRooms = allRooms.filter(r => r.status !== "full").length;
    await db.update(boardingHousesTable).set({ availableRooms }).where(eq(boardingHousesTable.id, room.boardingHouseId));

    // Create tenant record
    await db.insert(tenantsTable).values({
      studentId: reservation.studentId,
      roomId: reservation.roomId,
      boardingHouseId: reservation.boardingHouseId,
      paymentStatus: "unpaid",
      startDate: new Date(),
    });
  }

  res.json(serializeReservation({ ...updated, studentName: null, roomName: null, boardingHouseName: null, price: null }));
});

// Reject reservation (owner)
router.post("/reservations/:id/reject", requireAuth, requireRole("owner", "admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [reservation] = await db.select().from(reservationsTable).where(eq(reservationsTable.id, id));
  if (!reservation) {
    res.status(404).json({ error: "Reservation not found" });
    return;
  }

  const [updated] = await db.update(reservationsTable)
    .set({ status: "rejected" })
    .where(eq(reservationsTable.id, id))
    .returning();

  res.json(serializeReservation({ ...updated, studentName: null, roomName: null, boardingHouseName: null, price: null }));
});

export default router;
