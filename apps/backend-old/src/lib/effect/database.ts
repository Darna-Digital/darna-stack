import { Data, Effect } from "effect";

export class DatabaseError extends Data.TaggedError("DatabaseError")<{
  readonly cause: unknown;
}> {}

const DB_SPAN_ATTRS = { "db.system": "postgresql" } as const;

export const tryDb = <Result>(name: string, run: () => Promise<Result>): Effect.Effect<Result> =>
  Effect.tryPromise({
    try: run,
    catch: (cause) => new DatabaseError({ cause }),
  }).pipe(
    Effect.tapErrorTag("DatabaseError", (e) => Effect.logError("Database error", e.cause)),
    Effect.orDie,
    Effect.withSpan(name, { attributes: DB_SPAN_ATTRS }),
  );
