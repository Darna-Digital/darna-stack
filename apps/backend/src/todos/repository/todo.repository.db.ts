import * as Effect from "effect/Effect";
import { eq } from "drizzle-orm";
import { Database } from "../../db/database.ts";
import { todos } from "../../db/schema.ts";
import { tryQuery } from "../../db/storage.ts";
import { TodoNotFound, type Todo, type TodoId } from "../schema/todo.schema.model.ts";
import type { TodoRepo } from "./todo.repository.ts";

type Row = typeof todos.$inferSelect;

const toTodo = (row: Row): Todo => ({
  id: row.id as TodoId,
  title: row.title,
  done: row.done,
  ownerId: row.ownerId,
  createdAt: row.createdAt,
});

/**
 * Postgres-backed repository over the Effect-Drizzle `Database` (Hyperdrive →
 * PlanetScale). Uses `RETURNING` so create/update read back the row in one
 * round-trip.
 */
export const makeDbTodoRepository = Effect.gen(function* () {
  const db = yield* Database;

  const repo: TodoRepo = {
    list: (filter = {}) =>
      tryQuery(
        "db.todos.list",
        filter.ownerId
          ? db.select().from(todos).where(eq(todos.ownerId, filter.ownerId))
          : db.select().from(todos),
      ).pipe(Effect.map((rows) => rows.map(toTodo))),

    get: (id) =>
      tryQuery(
        "db.todos.get",
        db.select().from(todos).where(eq(todos.id, id)).limit(1),
      ).pipe(
        Effect.flatMap((rows) =>
          rows[0] ? Effect.succeed(toTodo(rows[0])) : Effect.fail(new TodoNotFound({ id })),
        ),
      ),

    create: (todo) =>
      tryQuery("db.todos.create", db.insert(todos).values(todo).returning()).pipe(
        Effect.map((rows) => toTodo(rows[0]!)),
      ),

    update: (id, patch) =>
      tryQuery(
        "db.todos.update",
        db.update(todos).set(patch).where(eq(todos.id, id)).returning(),
      ).pipe(
        Effect.flatMap((rows) =>
          rows[0] ? Effect.succeed(toTodo(rows[0])) : Effect.fail(new TodoNotFound({ id })),
        ),
      ),

    remove: (id) =>
      tryQuery(
        "db.todos.remove",
        db.delete(todos).where(eq(todos.id, id)).returning({ id: todos.id }),
      ).pipe(
        Effect.flatMap((rows) =>
          rows.length > 0 ? Effect.void : Effect.fail(new TodoNotFound({ id })),
        ),
      ),
  };

  return repo;
});
