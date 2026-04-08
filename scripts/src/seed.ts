import "dotenv/config";
import pg from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { and, eq, inArray } from "drizzle-orm";
import {
  boardingHousesTable,
  reservationsTable,
  roomsTable,
  tenantsTable,
  usersTable,
} from "@workspace/db/schema";

const { Pool } = pg;

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`${name} is required`);
  return v;
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

async function main() {
  const databaseUrl = requiredEnv("DATABASE_URL");

  const pool = new Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  // Keep re-running seed safe: remove prior sample rows by email prefix / house name prefix.
  const sampleEmails = [
    "admin@dormkada.sample",
    "owner1@dormkada.sample",
    "owner2@dormkada.sample",
    "student1@dormkada.sample",
    "student2@dormkada.sample",
  ];

  const existingUsers = await db
    .select({ id: usersTable.id, email: usersTable.email })
    .from(usersTable)
    .where(inArray(usersTable.email, sampleEmails));

  const existingUserIds = existingUsers.map((u) => u.id);

  if (existingUserIds.length > 0) {
    await db.delete(tenantsTable).where(inArray(tenantsTable.studentId, existingUserIds));
    await db.delete(reservationsTable).where(inArray(reservationsTable.studentId, existingUserIds));
    await db.delete(usersTable).where(inArray(usersTable.id, existingUserIds));
  }

  const sampleHouses = await db
    .select({ id: boardingHousesTable.id })
    .from(boardingHousesTable)
    .where(eq(boardingHousesTable.name, "Sample — BlueWave Dormitory"));
  const sampleHouseIds = sampleHouses.map((h) => h.id);
  if (sampleHouseIds.length > 0) {
    await db.delete(roomsTable).where(inArray(roomsTable.boardingHouseId, sampleHouseIds));
    await db.delete(boardingHousesTable).where(inArray(boardingHousesTable.id, sampleHouseIds));
  }

  // Users
  const now = new Date();
  const [admin] = await db
    .insert(usersTable)
    .values({
      email: "admin@dormkada.sample",
      fullName: "Sample Admin",
      // NOTE: This is NOT a real hash; use your register endpoint in real usage.
      // Seeded users are primarily for UI/testing.
      passwordHash: "seeded",
      role: "admin",
      status: "active",
    })
    .returning({ id: usersTable.id });

  const [owner1] = await db
    .insert(usersTable)
    .values({
      email: "owner1@dormkada.sample",
      fullName: "Sample Owner One",
      passwordHash: "seeded",
      role: "owner",
      status: "active",
      idImageUrl: "https://example.com/sample-owner-id-1.jpg",
    })
    .returning({ id: usersTable.id });

  const [owner2] = await db
    .insert(usersTable)
    .values({
      email: "owner2@dormkada.sample",
      fullName: "Sample Owner Two",
      passwordHash: "seeded",
      role: "owner",
      status: "active",
      idImageUrl: "https://example.com/sample-owner-id-2.jpg",
    })
    .returning({ id: usersTable.id });

  const [student1] = await db
    .insert(usersTable)
    .values({
      email: "student1@dormkada.sample",
      fullName: "Sample Student One",
      passwordHash: "seeded",
      role: "student",
      status: "active",
    })
    .returning({ id: usersTable.id });

  const [student2] = await db
    .insert(usersTable)
    .values({
      email: "student2@dormkada.sample",
      fullName: "Sample Student Two",
      passwordHash: "seeded",
      role: "student",
      status: "active",
    })
    .returning({ id: usersTable.id });

  // Boarding houses (approved so they show in Listings)
  const [house1] = await db
    .insert(boardingHousesTable)
    .values({
      ownerId: owner1.id,
      name: "Sample — BlueWave Dormitory",
      description:
        "A clean and student-friendly dorm near the main road. Quiet hours enforced.",
      address: "Purok 2, Brgy. Tanza, Boac, Marinduque",
      barangay: "Tanza",
      latitude: 13.4429,
      longitude: 122.0083,
      priceMin: 2500,
      priceMax: 4500,
      totalRooms: 3,
      availableRooms: 3,
      status: "approved",
      genderPolicy: "mixed",
      photos: [
        "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80",
      ],
      amenities: ["WiFi", "Water", "Electricity", "Laundry Area"],
      rules: "No smoking. Visitors until 8PM only.",
      contactEmail: "owner1@dormkada.sample",
      contactPhone: "+63 900 111 2222",
      socialMediaUrl: "https://facebook.com/",
      rating: 4.6,
      reviewCount: 12,
    })
    .returning({ id: boardingHousesTable.id });

  const [house2] = await db
    .insert(boardingHousesTable)
    .values({
      ownerId: owner2.id,
      name: "Sample — Sunlit Boarding House",
      description: "Affordable bedspacer rooms with good ventilation.",
      address: "Near Barangay Hall, Brgy. Tanza, Boac, Marinduque",
      barangay: "Tanza",
      latitude: 13.4422,
      longitude: 122.0091,
      priceMin: 1800,
      priceMax: 3000,
      totalRooms: 2,
      availableRooms: 2,
      status: "approved",
      genderPolicy: "female_only",
      photos: [
        "https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=1200&q=80",
      ],
      amenities: ["WiFi", "Study Area", "CCTV"],
      rules: "No loud music after 9PM.",
      contactEmail: "owner2@dormkada.sample",
      contactPhone: "+63 900 333 4444",
      socialMediaUrl: "https://facebook.com/",
      rating: 4.2,
      reviewCount: 6,
    })
    .returning({ id: boardingHousesTable.id });

  // Rooms
  const [r1, r2, r3] = await db
    .insert(roomsTable)
    .values([
      {
        boardingHouseId: house1.id,
        name: "Room A",
        type: "twin",
        floor: 1,
        price: 3500,
        totalSlots: 2,
        availableSlots: 2,
        status: "available",
        amenities: ["Fan", "Shared CR"],
        photos: [],
        description: "Twin sharing, good lighting.",
      },
      {
        boardingHouseId: house1.id,
        name: "Room B",
        type: "single",
        floor: 2,
        price: 4500,
        totalSlots: 1,
        availableSlots: 1,
        status: "available",
        amenities: ["Fan", "Private CR"],
        photos: [],
        description: "Single room, quieter floor.",
      },
      {
        boardingHouseId: house2.id,
        name: "Bedspacer 3F",
        type: "bedspacer_3",
        floor: 1,
        price: 2200,
        totalSlots: 6,
        availableSlots: 3,
        status: "almost_full",
        amenities: ["Bunk Beds", "Lockers"],
        photos: [],
        description: "Bedspacer room, shared amenities.",
      },
    ])
    .returning({ id: roomsTable.id, boardingHouseId: roomsTable.boardingHouseId });

  // Reservations
  const [pending] = await db
    .insert(reservationsTable)
    .values({
      studentId: student1.id,
      roomId: r1.id,
      boardingHouseId: house1.id,
      status: "pending",
      flagged: false,
      expiresAt: addHours(now, 24),
    })
    .returning({ id: reservationsTable.id });

  const [accepted] = await db
    .insert(reservationsTable)
    .values({
      studentId: student2.id,
      roomId: r3.id,
      boardingHouseId: house2.id,
      status: "accepted",
      flagged: true,
      expiresAt: addHours(now, -1),
    })
    .returning({ id: reservationsTable.id });

  // Tenant record for accepted reservation
  await db.insert(tenantsTable).values({
    studentId: student2.id,
    roomId: r3.id,
    boardingHouseId: house2.id,
    paymentStatus: "unpaid",
    startDate: now,
  });

  await pool.end();

  console.log("Seed complete:");
  console.log("- Users:", sampleEmails.join(", "));
  console.log("- Houses:", [house1.id, house2.id].join(", "));
  console.log("- Rooms:", [r1.id, r2.id, r3.id].join(", "));
  console.log("- Reservations:", [pending.id, accepted.id].join(", "));
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

