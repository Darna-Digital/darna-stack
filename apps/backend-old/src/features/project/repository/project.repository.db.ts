import { Effect } from "effect";
import { eq } from "drizzle-orm";
import { db } from "../../../lib/db/client.js";
import { projects } from "../../../lib/db/schema.js";
import { tryDb } from "../../../lib/effect/database.js";
import type { ProjectRepo } from "./project.repository.js";
import type { Project, ProjectId } from "../schema/project.model.js";

const rowToProject = (row: typeof projects.$inferSelect): Project => ({
  id: row.id as ProjectId,
  name: row.name,
  createdAt: row.createdAt,
});

export const createDbProjectRepo: ProjectRepo = {
  list: () =>
    tryDb("pg.projects.list", () => db.select().from(projects)).pipe(
      Effect.map((rows) => rows.map(rowToProject)),
    ),

  findById: (id) =>
    tryDb("pg.projects.findById", () =>
      db.select().from(projects).where(eq(projects.id, id)).limit(1),
    ).pipe(Effect.map((rows) => (rows[0] ? rowToProject(rows[0]) : undefined))),

  create: (input) =>
    Effect.gen(function* () {
      const project: Project = {
        id: crypto.randomUUID() as ProjectId,
        name: input.name,
        createdAt: new Date().toISOString(),
      };
      yield* tryDb("pg.projects.insert", () => db.insert(projects).values(project));
      return project;
    }),

  update: (id, patch) =>
    tryDb("pg.projects.update", () =>
      db
        .update(projects)
        .set({
          ...(patch.name !== undefined ? { name: patch.name } : {}),
        })
        .where(eq(projects.id, id))
        .returning(),
    ).pipe(Effect.map((rows) => (rows[0] ? rowToProject(rows[0]) : undefined))),

  remove: (id) =>
    tryDb("pg.projects.delete", () =>
      db.delete(projects).where(eq(projects.id, id)).returning({
        id: projects.id,
      }),
    ).pipe(Effect.map((rows) => rows.length > 0)),
};
