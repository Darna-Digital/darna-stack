import * as Cloudflare from "alchemy/Cloudflare";
import * as Drizzle from "alchemy/Drizzle";
import * as Planetscale from "alchemy/Planetscale";
import * as Effect from "effect/Effect";

/**
 * PlanetScale Postgres database + branch + role, with Drizzle migrations.
 *
 * `Drizzle.Schema` regenerates pending migration SQL from `./src/db/schema.ts`;
 * `PostgresBranch.migrationsDir` is wired to its `out`, so the branch applies new
 * migrations transactionally on deploy. Provider order:
 *   Drizzle.Schema -> PostgresDatabase -> PostgresBranch -> PostgresRole.
 */
export const PlanetscaleDb = Effect.gen(function* () {
  const schema = yield* Drizzle.Schema("app-schema", {
    schema: "./src/db/schema.ts",
    out: "./migrations",
    dialect: "postgres",
  });

  const database = yield* Planetscale.PostgresDatabase("app-db", {
    region: { slug: "eu-west" },
    clusterSize: "PS_5",
  });

  const branch = yield* Planetscale.PostgresBranch("app-branch", {
    database,
    migrationsDir: schema.out,
  });

  const role = yield* Planetscale.PostgresRole("app-role", {
    database,
    branch,
    inheritedRoles: ["postgres"],
  });

  return { database, branch, role, schema };
});

/** Cloudflare Hyperdrive pooling the PlanetScale role's connection. */
export const Hyperdrive: Effect.Effect<Cloudflare.Hyperdrive, never, any> = Effect.gen(
  function* () {
    const { role } = yield* PlanetscaleDb;
    return yield* Cloudflare.Hyperdrive("app-hyperdrive", {
      origin: role.origin,
    });
  },
);
