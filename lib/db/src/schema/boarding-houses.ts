import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const boardingHousesTable = pgTable("boarding_houses", {
  id: serial("id").primaryKey(),
  ownerId: integer("owner_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  barangay: text("barangay").notNull().default("Tanza"),
  latitude: real("latitude"),
  longitude: real("longitude"),
  priceMin: integer("price_min").notNull(),
  priceMax: integer("price_max").notNull(),
  totalRooms: integer("total_rooms").notNull().default(0),
  availableRooms: integer("available_rooms").notNull().default(0),
  status: text("status").notNull().default("pending"), // pending | approved | rejected
  genderPolicy: text("gender_policy").notNull().default("mixed"), // mixed | male_only | female_only
  photos: text("photos").array().notNull().default([]),
  amenities: text("amenities").array().notNull().default([]),
  rules: text("rules"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  socialMediaUrl: text("social_media_url"),
  rating: real("rating"),
  reviewCount: integer("review_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertBoardingHouseSchema = createInsertSchema(boardingHousesTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertBoardingHouse = z.infer<typeof insertBoardingHouseSchema>;
export type BoardingHouse = typeof boardingHousesTable.$inferSelect;
