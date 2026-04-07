import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, tenantsTable, usersTable, roomsTable, boardingHousesTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

// List tenants for owner's boarding houses
router.get("/tenants", requireAuth, requireRole("owner", "admin"), async (req, res): Promise<void> => {
  const { userId, role } = req.user!;

  const tenants = await db
    .select({
      id: tenantsTable.id,
      studentId: tenantsTable.studentId,
      roomId: tenantsTable.roomId,
      boardingHouseId: tenantsTable.boardingHouseId,
      paymentStatus: tenantsTable.paymentStatus,
      startDate: tenantsTable.startDate,
      studentName: usersTable.fullName,
      studentEmail: usersTable.email,
      roomName: roomsTable.name,
      boardingHouseName: boardingHousesTable.name,
    })
    .from(tenantsTable)
    .leftJoin(usersTable, eq(tenantsTable.studentId, usersTable.id))
    .leftJoin(roomsTable, eq(tenantsTable.roomId, roomsTable.id))
    .leftJoin(boardingHousesTable, eq(tenantsTable.boardingHouseId, boardingHousesTable.id))
    .where(
      role === "admin" ? undefined : eq(boardingHousesTable.ownerId, userId)
    );

  res.json(tenants.map(t => ({
    ...t,
    startDate: t.startDate.toISOString(),
    studentName: t.studentName ?? null,
    studentEmail: t.studentEmail ?? null,
    roomName: t.roomName ?? null,
    boardingHouseName: t.boardingHouseName ?? null,
  })));
});

// Update tenant payment status
router.patch("/tenants/:id/payment", requireAuth, requireRole("owner", "admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  const { paymentStatus } = req.body;

  if (!["paid", "unpaid"].includes(paymentStatus)) {
    res.status(400).json({ error: "Invalid payment status" });
    return;
  }

  const [tenant] = await db.update(tenantsTable)
    .set({ paymentStatus })
    .where(eq(tenantsTable.id, id))
    .returning();

  if (!tenant) {
    res.status(404).json({ error: "Tenant not found" });
    return;
  }

  res.json({
    id: tenant.id,
    studentId: tenant.studentId,
    roomId: tenant.roomId,
    boardingHouseId: tenant.boardingHouseId,
    paymentStatus: tenant.paymentStatus,
    startDate: tenant.startDate.toISOString(),
    studentName: null,
    studentEmail: null,
    roomName: null,
    boardingHouseName: null,
  });
});

export default router;
