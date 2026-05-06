import { boolean, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core"

export const todos = pgTable("todos", {
  id: uuid("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  done: boolean("done").notNull().default(false),
  createdAt: text("created_at").notNull(),
})
