import * as Effect from "effect/Effect";
import * as Schema from "effect/Schema";

export class StorageError extends Schema.TaggedErrorClass<StorageError>()(
  "StorageError",
  {},
  { httpApiStatus: 500 },
) {}

export type Patch<Row> = {
  [Key in keyof Omit<Row, "id">]?: Omit<Row, "id">[Key] | undefined;
};

const DB_SPAN_ATTRS = { "db.system": "postgresql" } as const;

export const tryQuery = <A, E, R>(
  name: string,
  query: Effect.Effect<A, E, R>,
): Effect.Effect<A, StorageError, R> =>
  query.pipe(
    Effect.mapError(() => new StorageError()),
    Effect.withSpan(name, { attributes: DB_SPAN_ATTRS }),
  );
