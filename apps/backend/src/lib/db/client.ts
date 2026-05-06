import "dotenv/config";
import { AsyncLocalStorage } from "node:async_hooks";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

export type Db = NodePgDatabase<typeof schema>;

const dbStore = new AsyncLocalStorage<Db>();

export const runWithDb = <T>(db: Db, fn: () => T): T => dbStore.run(db, fn);

const isWorkers =
  typeof navigator !== "undefined" && navigator.userAgent === "Cloudflare-Workers";

// Local Node dev keeps a long-lived pool; on Workers, the per-request Client
// is established in worker.ts and threaded through `runWithDb`.
let nodeCached: Db | undefined;
const getNodeDb = (): Db => {
  if (nodeCached) return nodeCached;
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. See apps/backend/.env.");
  }
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  pool.on("error", () => {
    nodeCached = undefined;
  });
  nodeCached = drizzle(pool, { schema });
  return nodeCached;
};

const resolve = (): Db => {
  if (isWorkers) {
    const d = dbStore.getStore();
    if (!d) throw new Error("db accessed outside of a request scope");
    return d;
  }
  return getNodeDb();
};

export const db = new Proxy({} as Db, {
  get: (_target, prop, receiver) => Reflect.get(resolve(), prop, receiver),
});
