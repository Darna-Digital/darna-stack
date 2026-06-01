import * as Effect from "effect/Effect";
import { RawSql } from "../../../layers/db/database.layer.ts";
import { tryQuery } from "../../../layers/db/db.ts";
import { TaskNotFound, type Task, type TaskId } from "../schema/task.schema.model.ts";
import type { TaskRepo } from "./task.repository.ts";

interface TaskRow {
  id: string;
  title: string;
  done: boolean;
  project_id: string;
  created_at: string;
}

const rowToTask = (r: TaskRow): Task => ({
  id: r.id as TaskId,
  title: r.title,
  done: r.done,
  projectId: r.project_id,
  createdAt: r.created_at,
});

export const makeDbTaskRepository = Effect.gen(function* () {
  const getSql = yield* RawSql;

  const repo: TaskRepo = {
    list: (filter = {}) =>
      tryQuery(
        "db.tasks.list",
        Effect.gen(function* () {
          const sql = yield* getSql;
          const rows = filter.projectId
            ? yield* sql`select id, title, done, project_id, created_at from tasks where project_id = ${filter.projectId}`
            : yield* sql`select id, title, done, project_id, created_at from tasks`;
          return (rows as unknown as ReadonlyArray<TaskRow>).map(rowToTask);
        }),
      ),

    get: (id) =>
      tryQuery(
        "db.tasks.get",
        Effect.gen(function* () {
          const sql = yield* getSql;
          return yield* sql`select id, title, done, project_id, created_at from tasks where id = ${id} limit 1`;
        }),
      ).pipe(
        Effect.flatMap((rows) => {
          const row = (rows as unknown as ReadonlyArray<TaskRow>)[0];
          return row ? Effect.succeed(rowToTask(row)) : Effect.fail(new TaskNotFound({ id }));
        }),
      ),

    create: (task) =>
      tryQuery(
        "db.tasks.create",
        Effect.gen(function* () {
          const sql = yield* getSql;
          yield* sql`insert into tasks (id, title, done, project_id, created_at)
            values (${task.id}, ${task.title}, ${task.done}, ${task.projectId}, ${task.createdAt})`;
          return task;
        }),
      ),

    update: (id, patch) =>
      tryQuery(
        "db.tasks.update",
        Effect.gen(function* () {
          const sql = yield* getSql;
          const title = patch.title;
          const done = patch.done;
          if (title !== undefined && done !== undefined) {
            yield* sql`update tasks set title = ${title}, done = ${done} where id = ${id}`;
          } else if (title !== undefined) {
            yield* sql`update tasks set title = ${title} where id = ${id}`;
          } else if (done !== undefined) {
            yield* sql`update tasks set done = ${done} where id = ${id}`;
          }
        }),
      ).pipe(Effect.flatMap(() => repo.get(id))),

    remove: (id) =>
      repo.get(id).pipe(
        Effect.flatMap(() =>
          tryQuery(
            "db.tasks.remove",
            Effect.gen(function* () {
              const sql = yield* getSql;
              yield* sql`delete from tasks where id = ${id}`;
            }),
          ),
        ),
        Effect.flatMap(() => Effect.void),
      ),
  };

  return repo;
});
