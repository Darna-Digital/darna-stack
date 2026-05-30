import { boolean, integer, pgTable, text, uuid, varchar } from "drizzle-orm/pg-core";

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

export const files = pgTable("files", {
  id: uuid("id").primaryKey(),
  name: varchar("name", { length: 255 }).notNull(),
  contentType: varchar("content_type", { length: 255 }).notNull(),
  size: integer("size").notNull(),
  status: varchar("status", { length: 16 }).notNull().default("pending"),
  uploadedAt: text("uploaded_at").notNull(),
});
