import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { app } from "./server.js";
import { runWithDb } from "./lib/db/client.js";
import * as schema from "./lib/db/schema.js";

export interface Env {
  HYPERDRIVE: Hyperdrive;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const client = new Client({ connectionString: env.HYPERDRIVE.connectionString });
    await client.connect();
    const db = drizzle(client, { schema });
    try {
      return await runWithDb(db, () => app.fetch(request, env, ctx));
    } finally {
      ctx.waitUntil(client.end());
    }
  },
} satisfies ExportedHandler<Env>;
