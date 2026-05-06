import { Data, Effect } from "effect";

export class StorageError extends Data.TaggedError("StorageError")<{
  readonly cause: unknown;
}> {}

const DB_SPAN_ATTRS = { "db.system": "postgresql" } as const;

export const tryDb = <Result>(name: string, run: () => Promise<Result>): Effect.Effect<Result> =>
  Effect.tryPromise({
    try: run,
    catch: (cause) => new StorageError({ cause }),
  }).pipe(
    Effect.tapErrorTag("StorageError", (e) => Effect.logError("Storage error", e.cause)),
    Effect.orDie,
    Effect.withSpan(name, { attributes: DB_SPAN_ATTRS }),
  );
