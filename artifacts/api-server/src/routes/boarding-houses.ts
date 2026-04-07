import { Router } from "express";
import { eq, and, gte, lte, sql } from "drizzle-orm";
import { db, boardingHousesTable, usersTable, roomsTable } from "@workspace/db";
import { requireAuth, requireRole } from "../middlewares/auth";

const router = Router();

// List approved boarding houses (public)
router.get("/boarding-houses", async (req, res): Promise<void> => {
  const { priceMin, priceMax, roomType, search } = req.query;

  let query = db
    .select({
      id: boardingHousesTable.id,
      ownerId: boardingHousesTable.ownerId,
      name: boardingHousesTable.name,
      description: boardingHousesTable.description,
      address: boardingHousesTable.address,
      barangay: boardingHousesTable.barangay,
      latitude: boardingHousesTable.latitude,
      longitude: boardingHousesTable.longitude,
      priceMin: boardingHousesTable.priceMin,
      priceMax: boardingHousesTable.priceMax,
      totalRooms: boardingHousesTable.totalRooms,
      availableRooms: boardingHousesTable.availableRooms,
      status: boardingHousesTable.status,
      genderPolicy: boardingHousesTable.genderPolicy,
      photos: boardingHousesTable.photos,
      amenities: boardingHousesTable.amenities,
      rules: boardingHousesTable.rules,
      contactEmail: boardingHousesTable.contactEmail,
      contactPhone: boardingHousesTable.contactPhone,
      socialMediaUrl: boardingHousesTable.socialMediaUrl,
      rating: boardingHousesTable.rating,
      reviewCount: boardingHousesTable.reviewCount,
      createdAt: boardingHousesTable.createdAt,
      ownerName: usersTable.fullName,
    })
    .from(boardingHousesTable)
    .leftJoin(usersTable, eq(boardingHousesTable.ownerId, usersTable.id))
    .where(eq(boardingHousesTable.status, "approved"));

  const results = await query;

  let filtered = results;
  if (priceMin) filtered = filtered.filter(bh => bh.priceMin >= Number(priceMin));
  if (priceMax) filtered = filtered.filter(bh => bh.priceMax <= Number(priceMax));
  if (search) {
    const s = String(search).toLowerCase();
    filtered = filtered.filter(bh => bh.name.toLowerCase().includes(s) || bh.address.toLowerCase().includes(s));
  }

  res.json(filtered.map(bh => ({
    ...bh,
    createdAt: bh.createdAt.toISOString(),
  })));
});

// Get my boarding houses (owner)
router.get("/boarding-houses/my", requireAuth, requireRole("owner", "admin"), async (req, res): Promise<void> => {
  const results = await db
    .select()
    .from(boardingHousesTable)
    .where(eq(boardingHousesTable.ownerId, req.user!.userId));

  res.json(results.map(bh => ({
    ...bh,
    createdAt: bh.createdAt.toISOString(),
    updatedAt: bh.updatedAt.toISOString(),
    ownerName: null,
  })));
});

// Get single boarding house
router.get("/boarding-houses/:id", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const [bh] = await db
    .select({
      id: boardingHousesTable.id,
      ownerId: boardingHousesTable.ownerId,
      name: boardingHousesTable.name,
      description: boardingHousesTable.description,
      address: boardingHousesTable.address,
      barangay: boardingHousesTable.barangay,
      latitude: boardingHousesTable.latitude,
      longitude: boardingHousesTable.longitude,
      priceMin: boardingHousesTable.priceMin,
      priceMax: boardingHousesTable.priceMax,
      totalRooms: boardingHousesTable.totalRooms,
      availableRooms: boardingHousesTable.availableRooms,
      status: boardingHousesTable.status,
      genderPolicy: boardingHousesTable.genderPolicy,
      photos: boardingHousesTable.photos,
      amenities: boardingHousesTable.amenities,
      rules: boardingHousesTable.rules,
      contactEmail: boardingHousesTable.contactEmail,
      contactPhone: boardingHousesTable.contactPhone,
      socialMediaUrl: boardingHousesTable.socialMediaUrl,
      rating: boardingHousesTable.rating,
      reviewCount: boardingHousesTable.reviewCount,
      createdAt: boardingHousesTable.createdAt,
      ownerName: usersTable.fullName,
    })
    .from(boardingHousesTable)
    .leftJoin(usersTable, eq(boardingHousesTable.ownerId, usersTable.id))
    .where(eq(boardingHousesTable.id, id));

  if (!bh) {
    res.status(404).json({ error: "Boarding house not found" });
    return;
  }

  const rooms = await db.select().from(roomsTable).where(eq(roomsTable.boardingHouseId, id));

  res.json({
    ...bh,
    createdAt: bh.createdAt.toISOString(),
    rooms: rooms.map(r => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    })),
  });
});

// Create boarding house (owner)
router.post("/boarding-houses", requireAuth, requireRole("owner"), async (req, res): Promise<void> => {
  const { name, description, address, barangay, latitude, longitude, priceMin, priceMax, genderPolicy, photos, amenities, rules, contactEmail, contactPhone, socialMediaUrl } = req.body;

  if (!name || !address || !barangay || priceMin == null || priceMax == null || !genderPolicy) {
    res.status(400).json({ error: "Missing required fields" });
    return;
  }

  const [bh] = await db.insert(boardingHousesTable).values({
    ownerId: req.user!.userId,
    name,
    description: description ?? null,
    address,
    barangay: barangay || "Tanza",
    latitude: latitude ?? null,
    longitude: longitude ?? null,
    priceMin: Number(priceMin),
    priceMax: Number(priceMax),
    genderPolicy,
    photos: photos || [],
    amenities: amenities || [],
    rules: rules ?? null,
    contactEmail: contactEmail ?? null,
    contactPhone: contactPhone ?? null,
    socialMediaUrl: socialMediaUrl ?? null,
    status: "pending",
  }).returning();

  res.status(201).json({
    ...bh,
    createdAt: bh.createdAt.toISOString(),
    updatedAt: bh.updatedAt.toISOString(),
    ownerName: null,
  });
});

// Update boarding house (owner)
router.patch("/boarding-houses/:id", requireAuth, requireRole("owner", "admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  const updateData: Record<string, unknown> = {};
  const fields = ["name", "description", "address", "barangay", "latitude", "longitude", "priceMin", "priceMax", "genderPolicy", "photos", "amenities", "rules", "contactEmail", "contactPhone", "socialMediaUrl"];
  for (const field of fields) {
    if (req.body[field] !== undefined) {
      updateData[field] = req.body[field];
    }
  }

  if (updateData.priceMin) updateData.priceMin = Number(updateData.priceMin);
  if (updateData.priceMax) updateData.priceMax = Number(updateData.priceMax);
  updateData.status = "pending"; // Re-review on update

  const [bh] = await db.update(boardingHousesTable).set(updateData).where(eq(boardingHousesTable.id, id)).returning();
  if (!bh) {
    res.status(404).json({ error: "Boarding house not found" });
    return;
  }

  res.json({ ...bh, createdAt: bh.createdAt.toISOString(), updatedAt: bh.updatedAt.toISOString(), ownerName: null });
});

// Delete boarding house (owner)
router.delete("/boarding-houses/:id", requireAuth, requireRole("owner", "admin"), async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);

  await db.delete(boardingHousesTable).where(eq(boardingHousesTable.id, id));
  res.sendStatus(204);
});

export default router;
