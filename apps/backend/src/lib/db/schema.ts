import { boolean, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";

export const projects = pgTable("projects", {
  id: uuid("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  createdAt: text("created_at").notNull(),
});

export const todos = pgTable("todos", {
  id: uuid("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  done: boolean("done").notNull().default(false),
  createdAt: text("created_at").notNull(),
  projectId: uuid("project_id").references(() => projects.id, {
    onDelete: "set null",
  }),
});
