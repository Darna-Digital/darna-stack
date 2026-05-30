import { Effect } from "effect";
import { r2 } from "../../../lib/r2/client.js";
import { presignPut as r2PresignPut } from "../../../lib/r2/presign.js";
import { tryR2 } from "../../../lib/effect/storage.js";
import type { FileStore } from "./file.storage.js";

export const createR2FileStore: FileStore = {
  put: (input) =>
    tryR2("r2.files.put", () =>
      r2.put(input.key, input.body, {
        httpMetadata: { contentType: input.contentType },
      }),
    ).pipe(Effect.asVoid),

  get: (key) =>
    tryR2("r2.files.get", () => r2.get(key)).pipe(
      Effect.flatMap((obj) =>
        obj
          ? tryR2("r2.files.read", () => obj.arrayBuffer()).pipe(
              Effect.map((buf) => new Uint8Array(buf)),
            )
          : Effect.succeed(undefined),
      ),
    ),

  head: (key) =>
    tryR2("r2.files.head", () => r2.head(key)).pipe(
      Effect.map((obj) => (obj ? { size: obj.size } : undefined)),
    ),

  presignPut: (input) =>
    tryR2("r2.files.presignPut", () =>
      r2PresignPut({
        key: input.key,
        contentType: input.contentType,
        expiresInSeconds: input.expiresInSeconds,
      }),
    ),

  remove: (key) => tryR2("r2.files.delete", () => r2.delete(key)).pipe(Effect.asVoid),
};
