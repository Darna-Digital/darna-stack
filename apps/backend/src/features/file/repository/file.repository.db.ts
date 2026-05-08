import { Effect } from "effect";
import { eq } from "drizzle-orm";
import { db } from "../../../lib/db/client.js";
import { files } from "../../../lib/db/schema.js";
import { tryDb } from "../../../lib/effect/database.js";
import type { FileRepo } from "./file.repository.js";
import type { FileId, FileMeta, FileStatus } from "../schema/file.model.js";

const rowToMeta = (row: typeof files.$inferSelect): FileMeta => ({
  id: row.id as FileId,
  name: row.name,
  contentType: row.contentType,
  size: row.size,
  status: row.status as FileStatus,
  uploadedAt: row.uploadedAt,
});

export const createDbFileRepo: FileRepo = {
  list: () =>
    tryDb("pg.files.list", () => db.select().from(files)).pipe(
      Effect.map((rows) => rows.map(rowToMeta)),
    ),

  findById: (id) =>
    tryDb("pg.files.findById", () => db.select().from(files).where(eq(files.id, id)).limit(1)).pipe(
      Effect.map((rows) => (rows[0] ? rowToMeta(rows[0]) : undefined)),
    ),

  create: (input) =>
    Effect.gen(function* () {
      const meta: FileMeta = {
        id: input.id,
        name: input.name,
        contentType: input.contentType,
        size: input.size,
        status: input.status,
        uploadedAt: new Date().toISOString(),
      };
      yield* tryDb("pg.files.insert", () => db.insert(files).values(meta));
      return meta;
    }),

  setReady: (input) =>
    tryDb("pg.files.setReady", () =>
      db
        .update(files)
        .set({ status: "ready", size: input.size })
        .where(eq(files.id, input.id))
        .returning(),
    ).pipe(Effect.map((rows) => (rows[0] ? rowToMeta(rows[0]) : undefined))),

  rename: (id, name) =>
    tryDb("pg.files.rename", () =>
      db.update(files).set({ name }).where(eq(files.id, id)).returning(),
    ).pipe(Effect.map((rows) => (rows[0] ? rowToMeta(rows[0]) : undefined))),

  remove: (id) =>
    tryDb("pg.files.delete", () =>
      db.delete(files).where(eq(files.id, id)).returning({ id: files.id }),
    ).pipe(Effect.map((rows) => rows.length > 0)),
};
