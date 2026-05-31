import * as Effect from "effect/Effect";
import { RawSql } from "../../db/sql.ts";
import { tryQuery } from "../../db/storage.ts";
import { TodoNotFound, type Todo, type TodoId } from "../schema/todo.schema.model.ts";
import type { TodoRepo } from "./todo.repository.ts";

interface TodoRow {
  id: string;
  title: string;
  done: boolean;
  owner_id: string;
  created_at: string;
}

const rowToTodo = (r: TodoRow): Todo => ({
  id: r.id as TodoId,
  title: r.title,
  done: r.done,
  ownerId: r.owner_id,
  createdAt: r.created_at,
});

/**
 * Postgres-backed todo repository using the **raw `@effect/sql` client** (no
 * drizzle) and **no `RETURNING`** — mutate, then read the row back. Refactored
 * off drizzle to isolate whether the write-hang lives in drizzle or the driver.
 * Compare with the auth-free `projects` repo (same approach).
 */
export const makeDbTodoRepository = Effect.gen(function* () {
  const getSql = yield* RawSql;

  const repo: TodoRepo = {
    list: (filter = {}) =>
      tryQuery(
        "db.todos.list",
        Effect.gen(function* () {
          const sql = yield* getSql;
          const rows = filter.ownerId
            ? yield* sql`select id, title, done, owner_id, created_at from todos where owner_id = ${filter.ownerId}`
            : yield* sql`select id, title, done, owner_id, created_at from todos`;
          return (rows as unknown as ReadonlyArray<TodoRow>).map(rowToTodo);
        }),
      ),

    get: (id) =>
      tryQuery(
        "db.todos.get",
        Effect.gen(function* () {
          const sql = yield* getSql;
          return yield* sql`select id, title, done, owner_id, created_at from todos where id = ${id} limit 1`;
        }),
      ).pipe(
        Effect.flatMap((rows) => {
          const row = (rows as unknown as ReadonlyArray<TodoRow>)[0];
          return row ? Effect.succeed(rowToTodo(row)) : Effect.fail(new TodoNotFound({ id }));
        }),
      ),

    create: (todo) =>
      tryQuery(
        "db.todos.create",
        Effect.gen(function* () {
          const sql = yield* getSql;
          yield* sql`insert into todos (id, title, done, owner_id, created_at)
            values (${todo.id}, ${todo.title}, ${todo.done}, ${todo.ownerId}, ${todo.createdAt})`;
          return todo;
        }),
      ),

    update: (id, patch) =>
      tryQuery(
        "db.todos.update",
        Effect.gen(function* () {
          const sql = yield* getSql;
          const title = patch.title;
          const done = patch.done;
          if (title !== undefined && done !== undefined) {
            yield* sql`update todos set title = ${title}, done = ${done} where id = ${id}`;
          } else if (title !== undefined) {
            yield* sql`update todos set title = ${title} where id = ${id}`;
          } else if (done !== undefined) {
            yield* sql`update todos set done = ${done} where id = ${id}`;
          }
        }),
      ).pipe(Effect.flatMap(() => repo.get(id))),

    remove: (id) =>
      repo.get(id).pipe(
        Effect.flatMap(() =>
          tryQuery(
            "db.todos.remove",
            Effect.gen(function* () {
              const sql = yield* getSql;
              yield* sql`delete from todos where id = ${id}`;
            }),
          ),
        ),
        Effect.flatMap(() => Effect.void),
      ),
  };

  return repo;
});
