import { pgTable, text, serial, timestamp, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const roomsTable = pgTable("rooms", {
  id: serial("id").primaryKey(),
  boardingHouseId: integer("boarding_house_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // single | twin | triple | quad | bedspacer_2 | bedspacer_3
  floor: integer("floor"),
  price: integer("price").notNull(),
  totalSlots: integer("total_slots").notNull(),
  availableSlots: integer("available_slots").notNull(),
  status: text("status").notNull().default("available"), // available | almost_full | full
  amenities: text("amenities").array().notNull().default([]),
  photos: text("photos").array().notNull().default([]),
  description: text("description"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow().$onUpdate(() => new Date()),
});

export const insertRoomSchema = createInsertSchema(roomsTable).omit({ id: true, createdAt: true, updatedAt: true });
export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof roomsTable.$inferSelect;
