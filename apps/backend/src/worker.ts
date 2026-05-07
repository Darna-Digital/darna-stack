import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { instrument, type ResolveConfigFn } from "@microlabs/otel-cf-workers";
import { app } from "./server.js";
import { runWithDb } from "./lib/db/client.js";
import * as schema from "./lib/db/schema.js";

export interface Env {
  HYPERDRIVE: Hyperdrive;
  OTEL_EXPORTER_OTLP_ENDPOINT: string;
  GRAFANA_OTEL_AUTH_HEADER: string;
  OTEL_DEPLOYMENT_ENV?: string;
}

const handler = {
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

const config: ResolveConfigFn<Env> = (env) => ({
  exporter: {
    url: `${env.OTEL_EXPORTER_OTLP_ENDPOINT.replace(/\/$/, "")}/v1/traces`,
    headers: { Authorization: env.GRAFANA_OTEL_AUTH_HEADER },
  },
  service: {
    name: "darna-backend",
    version: "0.0.0",
  },
  postProcessor: (spans) => {
    const env_ = env.OTEL_DEPLOYMENT_ENV ?? "production";
    for (const span of spans) {
      span.resource.attributes["deployment.environment"] = env_;
    }
    return spans;
  },
});

export default instrument(handler, config);
