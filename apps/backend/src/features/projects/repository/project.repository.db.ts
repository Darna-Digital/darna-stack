import * as Effect from "effect/Effect";
import { RawSql } from "../../../layers/db/database.layer.ts";
import { tryQuery } from "../../../layers/db/db.ts";
import { ProjectNotFound, type Project, type ProjectId } from "../schema/project.schema.model.ts";
import type { ProjectRepo } from "./project.repository.ts";

interface ProjectRow {
  id: string;
  name: string;
  owner_id: string;
  created_at: string;
}

const rowToProject = (r: ProjectRow): Project => ({
  id: r.id as ProjectId,
  name: r.name,
  ownerId: r.owner_id,
  createdAt: r.created_at,
});

export const makeDbProjectRepository = Effect.gen(function* () {
  const getSql = yield* RawSql;

  const repo: ProjectRepo = {
    list: (filter = {}) =>
      tryQuery(
        "db.projects.list",
        Effect.gen(function* () {
          const sql = yield* getSql;
          const rows = filter.ownerId
            ? yield* sql`select id, name, owner_id, created_at from projects where owner_id = ${filter.ownerId}`
            : yield* sql`select id, name, owner_id, created_at from projects`;
          return (rows as unknown as ReadonlyArray<ProjectRow>).map(rowToProject);
        }),
      ),

    get: (id) =>
      tryQuery(
        "db.projects.get",
        Effect.gen(function* () {
          const sql = yield* getSql;
          return yield* sql`select id, name, owner_id, created_at from projects where id = ${id} limit 1`;
        }),
      ).pipe(
        Effect.flatMap((rows) => {
          const row = (rows as unknown as ReadonlyArray<ProjectRow>)[0];
          return row ? Effect.succeed(rowToProject(row)) : Effect.fail(new ProjectNotFound({ id }));
        }),
      ),

    create: (project) =>
      tryQuery(
        "db.projects.create",
        Effect.gen(function* () {
          const sql = yield* getSql;
          yield* sql`insert into projects (id, name, owner_id, created_at)
            values (${project.id}, ${project.name}, ${project.ownerId}, ${project.createdAt})`;
          return project;
        }),
      ),

    update: (id, patch) =>
      tryQuery(
        "db.projects.update",
        Effect.gen(function* () {
          const sql = yield* getSql;
          const name = patch.name;
          if (name !== undefined) {
            yield* sql`update projects set name = ${name} where id = ${id}`;
          }
        }),
      ).pipe(Effect.flatMap(() => repo.get(id))),

    remove: (id) =>
      repo.get(id).pipe(
        Effect.flatMap(() =>
          tryQuery(
            "db.projects.remove",
            Effect.gen(function* () {
              const sql = yield* getSql;
              yield* sql`delete from projects where id = ${id}`;
            }),
          ),
        ),
        Effect.flatMap(() => Effect.void),
      ),
  };

  return repo;
});
