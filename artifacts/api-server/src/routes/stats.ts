import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, boardingHousesTable, roomsTable, reservationsTable } from "@workspace/db";

const router = Router();

router.get("/stats/summary", async (req, res): Promise<void> => {
  const allListings = await db.select().from(boardingHousesTable);
  const approvedListings = allListings.filter(bh => bh.status === "approved");
  const availableListings = approvedListings.filter(bh => bh.availableRooms > 0);

  const allRooms = await db.select().from(roomsTable);
  const availableRooms = allRooms.filter(r => r.status !== "full").length;

  const allReservations = await db.select().from(reservationsTable);
  const activeReservations = allReservations.filter(r => r.status === "pending" || r.status === "accepted").length;

  res.json({
    totalListings: approvedListings.length,
    availableListings: availableListings.length,
    totalRooms: allRooms.length,
    availableRooms,
    activeReservations,
  });
});

export default router;
