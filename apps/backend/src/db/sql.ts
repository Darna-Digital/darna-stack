import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import type * as SqlClient from "effect/unstable/sql/SqlClient";
import type { SqlError } from "effect/unstable/sql/SqlError";

/**
 * Raw `@effect/sql` client (PostgreSQL via `@effect/sql-pg`), bypassing drizzle
 * entirely. Used to narrow down whether the write-hang lives in drizzle or in
 * the sql/driver layer.
 *
 * The service value is an `Effect` that resolves the `SqlClient` lazily: the
 * Hyperdrive binding can only be read at request time, not at plan/deploy time,
 * so the connection must not be opened when the layer is built. The Worker
 * builds this once per isolate (cached) on a never-closing scope.
 *
 * Usage in a repository:
 * ```ts
 * const getSql = yield* RawSql;        // Effect<SqlClient>
 * const sql = yield* getSql;           // SqlClient (cached per isolate)
 * const rows = yield* sql`select * from todos where id = ${id}`;
 * ```
 */
export class RawSql extends Context.Service<
  RawSql,
  Effect.Effect<SqlClient.SqlClient, SqlError>
>()("RawSql") {}
