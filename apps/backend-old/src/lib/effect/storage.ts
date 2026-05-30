import { Data, Effect } from "effect";

export class StorageError extends Data.TaggedError("StorageError")<{
  readonly cause: unknown;
}> {}

const R2_SPAN_ATTRS = { "storage.system": "cloudflare-r2" } as const;

export const tryR2 = <Result>(name: string, run: () => Promise<Result>): Effect.Effect<Result> =>
  Effect.tryPromise({
    try: run,
    catch: (cause) => new StorageError({ cause }),
  }).pipe(
    Effect.tapErrorTag("StorageError", (e) =>
      Effect.logError("Storage error", e.cause instanceof Error ? e.cause.stack : e.cause),
    ),
    Effect.orDie,
    Effect.withSpan(name, { attributes: R2_SPAN_ATTRS }),
  );
