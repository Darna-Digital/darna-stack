import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";
import * as Scope from "effect/Scope";
import * as PgClient from "@effect/sql-pg/PgClient";
import * as SqlClient from "effect/unstable/sql/SqlClient";
import type { SqlError } from "effect/unstable/sql/SqlError";

/**
 * Raw `@effect/sql` client (PostgreSQL via `@effect/sql-pg`), bypassing drizzle
 * entirely. The drizzle-orm rc effect-postgres UPDATE/DELETE builders hang under
 * workerd; this raw client does not.
 *
 * The service value is an `Effect` that resolves the `SqlClient` lazily: the
 * Hyperdrive binding can only be read at request time, not at plan/deploy time,
 * so the connection must not be opened when the layer is built. {@link makeRawSqlLive}
 * builds it once per isolate (cached) on a never-closing scope.
 *
 * Usage in a repository:
 * ```ts
 * const getSql = yield* RawSql;        // Effect<SqlClient>
 * const sql = yield* getSql;           // SqlClient (cached per isolate)
 * const rows = yield* sql`select * from tasks where id = ${id}`;
 * ```
 */
export class RawSql extends Context.Service<
  RawSql,
  Effect.Effect<SqlClient.SqlClient, SqlError>
>()("RawSql") {}

/**
 * Build the live {@link RawSql} layer from a Hyperdrive connection string.
 *
 * Run this **once per isolate** in the Worker's init phase (it returns a
 * constant `Layer.succeed`, cheap to re-provide per request). The SqlClient
 * itself is resolved lazily and memoized via `Effect.cached` on a manually
 * created, never-closing scope — so the connection string (the Hyperdrive
 * binding) is only read on the first query, never at plan/deploy time when the
 * binding is absent. The cached effect requires `RuntimeContext` (provided at
 * the Worker fetch boundary via PlatformServices); we erase it from the service
 * type the repositories see — the same trick alchemy's `Drizzle.postgres` proxy
 * uses for its db.
 */
export const makeRawSqlLive = <E, R>(
  connectionString: Effect.Effect<Redacted.Redacted<string>, E, R>,
) =>
  Effect.gen(function* () {
    const sqlScope = yield* Scope.make();
    const getSqlClient = yield* Effect.cached(
      Effect.gen(function* () {
        const url = yield* connectionString;
        const ctx = yield* Layer.buildWithScope(PgClient.layer({ url }), sqlScope);
        return Context.get(ctx, SqlClient.SqlClient);
      }),
    );
    return Layer.succeed(
      RawSql,
      getSqlClient as Effect.Effect<SqlClient.SqlClient, SqlError>,
    );
  });
