import { Effect } from "effect";
import { eq } from "drizzle-orm";
import { db } from "../../../lib/db/client.js";
import { todos } from "../../../lib/db/schema.js";
import { tryDb } from "../../../lib/effect/storage.js";
import type { TodoRepo } from "./todo.repository.js";
import type { ProjectId } from "../../project/schema/project.model.js";
import type { Todo, TodoId } from "../schema/todo.model.js";

const rowToTodo = (row: typeof todos.$inferSelect): Todo => ({
  id: row.id as TodoId,
  title: row.title,
  done: row.done,
  createdAt: row.createdAt,
  projectId: (row.projectId as ProjectId | null) ?? null,
});

export const createDbTodoRepo: TodoRepo = {
  list: () =>
    tryDb("pg.todos.list", () => db.select().from(todos)).pipe(
      Effect.map((rows) => rows.map(rowToTodo)),
    ),

  listByProject: (projectId) =>
    tryDb("pg.todos.listByProject", () =>
      db.select().from(todos).where(eq(todos.projectId, projectId)),
    ).pipe(Effect.map((rows) => rows.map(rowToTodo))),

  findById: (id) =>
    tryDb("pg.todos.findById", () => db.select().from(todos).where(eq(todos.id, id)).limit(1)).pipe(
      Effect.map((rows) => (rows[0] ? rowToTodo(rows[0]) : undefined)),
    ),

  create: (input) =>
    Effect.gen(function* () {
      const todo: Todo = {
        id: crypto.randomUUID() as TodoId,
        title: input.title,
        done: false,
        createdAt: new Date().toISOString(),
        projectId: input.projectId ?? null,
      };
      yield* tryDb("pg.todos.insert", () => db.insert(todos).values(todo));
      return todo;
    }),

  update: (id, patch) =>
    tryDb("pg.todos.update", () =>
      db
        .update(todos)
        .set({
          ...(patch.title !== undefined ? { title: patch.title } : {}),
          ...(patch.done !== undefined ? { done: patch.done } : {}),
          ...(patch.projectId !== undefined ? { projectId: patch.projectId } : {}),
        })
        .where(eq(todos.id, id))
        .returning(),
    ).pipe(Effect.map((rows) => (rows[0] ? rowToTodo(rows[0]) : undefined))),

  remove: (id) =>
    tryDb("pg.todos.delete", () =>
      db.delete(todos).where(eq(todos.id, id)).returning({ id: todos.id }),
    ).pipe(Effect.map((rows) => rows.length > 0)),
};
