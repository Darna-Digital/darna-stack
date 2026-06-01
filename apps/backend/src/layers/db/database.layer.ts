import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";
import * as Scope from "effect/Scope";
import * as PgClient from "@effect/sql-pg/PgClient";
import * as SqlClient from "effect/unstable/sql/SqlClient";
import type { SqlError } from "effect/unstable/sql/SqlError";

export class RawSql extends Context.Service<
  RawSql,
  Effect.Effect<SqlClient.SqlClient, SqlError>
>()("RawSql") {}

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
