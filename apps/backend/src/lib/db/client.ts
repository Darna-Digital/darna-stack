import { AsyncLocalStorage } from "node:async_hooks";
import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import * as schema from "./schema.js";

export type Db = NodePgDatabase<typeof schema>;

const dbStore = new AsyncLocalStorage<Db>();

export const runWithDb = <T>(db: Db, fn: () => T): T => dbStore.run(db, fn);

export const db = new Proxy({} as Db, {
  get: (_target, prop, receiver) => {
    const d = dbStore.getStore();
    if (!d) throw new Error("db accessed outside of a request scope");
    return Reflect.get(d, prop, receiver);
  },
});
