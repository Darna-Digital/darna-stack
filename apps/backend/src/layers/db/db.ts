import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";

/** Generic persistence failure — never leaks driver details to the client. */
export class StorageError extends Schema.TaggedErrorClass<StorageError>()(
  "StorageError",
  {},
  { httpApiStatus: 500 },
) {}

/** A partial update over a row, excluding its `id`. */
export type Patch<Row> = {
  [Key in keyof Omit<Row, "id">]?: Omit<Row, "id">[Key] | undefined;
};

const DB_SPAN_ATTRS = { "db.system": "postgresql" } as const;

/**
 * Wrap an Effect-Drizzle query: trace it and collapse any driver error into a
 * {@link StorageError}. (The alchemy `Database` is Effect-based — queries are
 * Effects, not Promises — so this maps the error channel rather than wrapping a
 * Promise like a node-postgres `tryDb` would.)
 */
export const tryQuery = <A, E, R>(
  name: string,
  query: Effect.Effect<A, E, R>,
): Effect.Effect<A, StorageError, R> =>
  query.pipe(
    Effect.mapError(() => new StorageError()),
    Effect.withSpan(name, { attributes: DB_SPAN_ATTRS }),
  );
