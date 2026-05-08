import { Effect, Ref } from "effect";
import type { FileStore } from "./file.storage.js";
import type { FileId } from "../schema/file.model.js";

export const createMemoryFileStore = (
  seed: readonly { key: FileId; body: Uint8Array }[] = [],
): Effect.Effect<FileStore> =>
  Effect.gen(function* () {
    const ref = yield* Ref.make<Map<FileId, Uint8Array>>(new Map(seed.map((s) => [s.key, s.body])));

    const put: FileStore["put"] = (input) =>
      Ref.update(ref, (m) => new Map(m).set(input.key, input.body));

    const get: FileStore["get"] = (key) => Ref.get(ref).pipe(Effect.map((m) => m.get(key)));

    const head: FileStore["head"] = (key) =>
      Ref.get(ref).pipe(
        Effect.map((m) => {
          const body = m.get(key);
          return body ? { size: body.byteLength } : undefined;
        }),
      );

    const presignPut: FileStore["presignPut"] = (input) =>
      Effect.succeed(
        `memory://upload/${input.key}?contentType=${encodeURIComponent(input.contentType)}`,
      );

    const remove: FileStore["remove"] = (key) =>
      Ref.update(ref, (m) => {
        const next = new Map(m);
        next.delete(key);
        return next;
      });

    return { put, get, head, presignPut, remove };
  });
