import * as Cloudflare from "alchemy/Cloudflare";
import * as Drizzle from "alchemy/Drizzle";
import * as Planetscale from "alchemy/Planetscale";
import * as Effect from "effect/Effect";

export const PlanetscaleDb = Effect.gen(function* () {
  const schema = yield* Drizzle.Schema("app-schema", {
    schema: "./src/layers/db/schema.ts",
    out: "./src/layers/db/migrations",
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

export const Hyperdrive: Effect.Effect<Cloudflare.Hyperdrive, never, any> = Effect.gen(
  function* () {
    const { role } = yield* PlanetscaleDb;
    return yield* Cloudflare.Hyperdrive("app-hyperdrive", {
      origin: role.origin,
    });
  },
);
