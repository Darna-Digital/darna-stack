import "dotenv/config";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "./schema.js";

export type Db = ReturnType<typeof drizzle<typeof schema>>;

let instance: Db | undefined;

const init = (): Db => {
  if (instance) return instance;
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not set. See apps/backend/.env.");
  }
  const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
  instance = drizzle(pool, { schema });
  return instance;
};

export const db = new Proxy({} as Db, {
  get: (_target, prop, receiver) => Reflect.get(init(), prop, receiver),
});
