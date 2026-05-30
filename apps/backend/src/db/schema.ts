import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

/** Postgres `users` table (PlanetScale via Hyperdrive). */
export const Users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type User = typeof Users.$inferSelect;
export type NewUser = typeof Users.$inferInsert;
