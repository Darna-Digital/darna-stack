import { Effect, Ref } from "effect";
import type { FileRepo } from "./file.repository.js";
import type { FileId, FileMeta } from "../schema/file.model.js";

export const createMemoryFileRepo = (seed: readonly FileMeta[] = []): Effect.Effect<FileRepo> =>
  Effect.gen(function* () {
    const ref = yield* Ref.make<Map<FileId, FileMeta>>(new Map(seed.map((f) => [f.id, f])));

    const list: FileRepo["list"] = () =>
      Ref.get(ref).pipe(Effect.map((m) => Array.from(m.values())));

    const findById: FileRepo["findById"] = (id) => Ref.get(ref).pipe(Effect.map((m) => m.get(id)));

    const create: FileRepo["create"] = (input) =>
      Effect.sync(() => {
        const meta: FileMeta = {
          id: input.id,
          name: input.name,
          contentType: input.contentType,
          size: input.size,
          status: input.status,
          uploadedAt: new Date().toISOString(),
        };
        return meta;
      }).pipe(
        Effect.flatMap((meta) =>
          Ref.update(ref, (m) => new Map(m).set(meta.id, meta)).pipe(Effect.as(meta)),
        ),
      );

    const setReady: FileRepo["setReady"] = (input) =>
      Ref.modify(ref, (m) => {
        const existing = m.get(input.id);
        if (!existing) return [undefined, m] as const;
        const next: FileMeta = { ...existing, status: "ready", size: input.size };
        const nextMap = new Map(m).set(input.id, next);
        return [next, nextMap] as const;
      });

    const rename: FileRepo["rename"] = (id, name) =>
      Ref.modify(ref, (m) => {
        const existing = m.get(id);
        if (!existing) return [undefined, m] as const;
        const next: FileMeta = { ...existing, name };
        const nextMap = new Map(m).set(id, next);
        return [next, nextMap] as const;
      });

    const remove: FileRepo["remove"] = (id) =>
      Ref.modify(ref, (m) => {
        if (!m.has(id)) return [false, m] as const;
        const nextMap = new Map(m);
        nextMap.delete(id);
        return [true, nextMap] as const;
      });

    return { list, findById, create, setReady, rename, remove };
  });
