import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

export type Db = ReturnType<typeof drizzle<typeof schema>>;

let runtimeEnv: { HYPERDRIVE?: Hyperdrive } | undefined;
export const setRuntimeEnv = (env: { HYPERDRIVE?: Hyperdrive } | undefined) => {
  runtimeEnv = env;
};

const getPoolConfig = (): pg.PoolConfig => {
  const hd = runtimeEnv?.HYPERDRIVE?.connectionString;
  if (hd) {
    // Hyperdrive terminates TLS at its edge; the Worker→Hyperdrive hop is
    // cleartext over Cloudflare's internal network, so disable client SSL.
    return { connectionString: hd, ssl: false };
  }
  if (process.env.DATABASE_URL) return { connectionString: process.env.DATABASE_URL };
  throw new Error("DATABASE_URL is not set. See apps/backend/.env.");
};

// Cloudflare service bindings (Hyperdrive included) are tied to the request's
// I/O context, so a module-scoped pool from request N hangs when reused by
// request N+1. Build a fresh pool per query; Hyperdrive's edge handles the
// actual connection pooling. For local Node dev we cache the pool — there's
// no Hyperdrive and a long-lived pool is desirable.
const isWorkers = typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

let cached: Db | undefined;

const create = (): Db => {
  const pool = new pg.Pool(getPoolConfig());
  pool.on("error", () => {});
  return drizzle(pool, { schema });
};

const get = (): Db => {
  if (isWorkers) return create();
  if (!cached) cached = create();
  return cached;
};

export const db = new Proxy({} as Db, {
  get: (_target, prop, receiver) => Reflect.get(get(), prop, receiver),
});
