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

let instance: Db | undefined;

const init = (): Db => {
  if (instance) return instance;
  const pool = new pg.Pool(getPoolConfig());
  pool.on("error", () => {
    instance = undefined;
  });
  instance = drizzle(pool, { schema });
  return instance;
};

export const db = new Proxy({} as Db, {
  get: (_target, prop, receiver) => Reflect.get(init(), prop, receiver),
});
