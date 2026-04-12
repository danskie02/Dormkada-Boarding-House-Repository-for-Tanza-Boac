import { Router } from "express";
import { eq, or, and } from "drizzle-orm";
import { db, reservationsTable, roomsTable, boardingHousesTable, usersTable, tenantsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";
import { sendReservationAcceptedEmail, sendReservationRejectedEmail, sendNewReservationRequestEmail, sendReservationCancelledEmail } from "../lib/email-service";
import { logger } from "../lib/logger";

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
    cancellationReason: r.cancellationReason ?? null,
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
      cancellationReason: reservationsTable.cancellationReason,
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

  const [reservation] = await db.insert(reservationsTable).values({
    studentId: req.user!.userId,
    roomId: room.id,
    boardingHouseId: room.boardingHouseId,
    status: "pending",
    flagged: false,
  }).returning();

  // Fetch student, room, and boarding house information for email notification
  const [student] = await db.select({ fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, req.user!.userId));
  const [boardingHouse] = await db.select({ name: boardingHousesTable.name, ownerId: boardingHousesTable.ownerId }).from(boardingHousesTable).where(eq(boardingHousesTable.id, room.boardingHouseId));

  // Fetch owner email for notification
  if (boardingHouse) {
    const [owner] = await db.select({ email: usersTable.email, fullName: usersTable.fullName }).from(usersTable).where(eq(usersTable.id, boardingHouse.ownerId));
    
    if (owner?.email && owner?.fullName && student?.fullName) {
      sendNewReservationRequestEmail(
        owner.email,
        owner.fullName,
        student.fullName,
        room.name,
        boardingHouse.name
      ).catch(err => logger.error("Failed to send new reservation request email to owner:", err));
    }
  }

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
      cancellationReason: reservationsTable.cancellationReason,
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

  // Fetch student and room details for email and room update
  const [studentInfo] = await db
    .select({
      email: usersTable.email,
      fullName: usersTable.fullName,
    })
    .from(usersTable)
    .where(eq(usersTable.id, reservation.studentId));

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

    // Fetch boarding house name for email
    const [boardingHouse] = await db
      .select({ name: boardingHousesTable.name })
      .from(boardingHousesTable)
      .where(eq(boardingHousesTable.id, room.boardingHouseId));

    // Send acceptance email asynchronously (don't await to avoid blocking the response)
    if (studentInfo?.email && studentInfo?.fullName && room?.name && boardingHouse?.name) {
      sendReservationAcceptedEmail(
        studentInfo.email,
        studentInfo.fullName,
        room.name,
        boardingHouse.name
      ).catch(err => logger.error("Failed to send acceptance email:", err));
    }
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

  // Fetch student and room details for email
  const [studentInfo] = await db
    .select({
      email: usersTable.email,
      fullName: usersTable.fullName,
    })
    .from(usersTable)
    .where(eq(usersTable.id, reservation.studentId));

  // Fetch room and boarding house details
  const [room] = await db
    .select({
      name: roomsTable.name,
      boardingHouseId: roomsTable.boardingHouseId,
    })
    .from(roomsTable)
    .where(eq(roomsTable.id, reservation.roomId));

  if (room) {
    const [boardingHouse] = await db
      .select({ name: boardingHousesTable.name })
      .from(boardingHousesTable)
      .where(eq(boardingHousesTable.id, room.boardingHouseId));

    // Send rejection email asynchronously (don't await to avoid blocking the response)
    if (studentInfo?.email && studentInfo?.fullName && room?.name && boardingHouse?.name) {
      sendReservationRejectedEmail(
        studentInfo.email,
        studentInfo.fullName,
        room.name,
        boardingHouse.name,
        req.body.reason
      ).catch(err => logger.error("Failed to send rejection email:", err));
    }
  }

  res.json(serializeReservation({ ...updated, studentName: null, roomName: null, boardingHouseName: null, price: null }));
});

// Cancel reservation (student - only for accepted reservations)
router.post("/reservations/:id/cancel", requireAuth, requireRole("student"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { cancellationReason } = req.body;

  const [reservation] = await db.select().from(reservationsTable).where(eq(reservationsTable.id, id));
  if (!reservation) {
    res.status(404).json({ error: "Reservation not found" });
    return;
  }

  // Only allow cancellation of accepted reservations
  if (reservation.status !== "accepted") {
    res.status(400).json({ error: "Only accepted reservations can be cancelled" });
    return;
  }

  // Only allow student to cancel their own reservation
  if (reservation.studentId !== req.user!.userId) {
    res.status(403).json({ error: "You can only cancel your own reservations" });
    return;
  }

  // Update reservation to cancelled status with reason
  const [updated] = await db.update(reservationsTable)
    .set({ 
      status: "cancelled",
      cancellationReason: cancellationReason ?? null,
    })
    .where(eq(reservationsTable.id, id))
    .returning();

  // Fetch student and room details for email and room update
  const [student] = await db
    .select({
      fullName: usersTable.fullName,
    })
    .from(usersTable)
    .where(eq(usersTable.id, reservation.studentId));

  // Increment available slots
  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, reservation.roomId));
  if (room) {
    const newAvailable = room.availableSlots + 1;
    const newStatus = newAvailable > 0 ? "available" : "full";
    await db.update(roomsTable).set({ availableSlots: newAvailable, status: newStatus }).where(eq(roomsTable.id, room.id));

    // Delete tenant record
    await db
      .delete(tenantsTable)
      .where(
        and(
          eq(tenantsTable.studentId, reservation.studentId),
          eq(tenantsTable.roomId, reservation.roomId)
        )
      );

    // Fetch boarding house and owner information
    const [boardingHouse] = await db
      .select({ 
        name: boardingHousesTable.name,
        ownerId: boardingHousesTable.ownerId,
      })
      .from(boardingHousesTable)
      .where(eq(boardingHousesTable.id, room.boardingHouseId));

    if (boardingHouse) {
      const [owner] = await db
        .select({
          email: usersTable.email,
          fullName: usersTable.fullName,
        })
        .from(usersTable)
        .where(eq(usersTable.id, boardingHouse.ownerId));

      // Send cancellation email asynchronously
      if (owner?.email && owner?.fullName && student?.fullName && room?.name && boardingHouse?.name) {
        sendReservationCancelledEmail(
          owner.email,
          owner.fullName,
          student.fullName,
          room.name,
          boardingHouse.name,
          cancellationReason
        ).catch(err => logger.error("Failed to send cancellation email to owner:", err));
      }
    }

    // Update boarding house available rooms
    const allRooms = await db.select().from(roomsTable).where(eq(roomsTable.boardingHouseId, room.boardingHouseId));
    const availableRooms = allRooms.filter(r => r.status !== "full").length;
    await db.update(boardingHousesTable).set({ availableRooms }).where(eq(boardingHousesTable.id, room.boardingHouseId));
  }

  res.json(serializeReservation({ ...updated, studentName: null, roomName: null, boardingHouseName: null, price: null }));
});

export default router;
