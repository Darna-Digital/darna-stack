import { Client } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import {
  BatchTraceSpanProcessor,
  instrument,
  OTLPExporter,
  type ResolveConfigFn,
} from "@microlabs/otel-cf-workers";
import type { ReadableSpan, Span as SDKSpan, SpanProcessor } from "@opentelemetry/sdk-trace-base";
import type { Context } from "@opentelemetry/api";
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

function makePropagateRouteProcessor(): SpanProcessor {
  const rootByTrace = new Map<string, SDKSpan>();
  return {
    onStart(span: SDKSpan, _parentContext: Context) {
      if (span.parentSpanContext === undefined) {
        rootByTrace.set(span.spanContext().traceId, span);
      }
    },
    onEnd(span: ReadableSpan) {
      const traceId = span.spanContext().traceId;
      if (span.parentSpanContext === undefined) {
        rootByTrace.delete(traceId);
        return;
      }
      const route = span.attributes["http.route"];
      if (typeof route !== "string") return;
      const root = rootByTrace.get(traceId);
      if (root && root.attributes["http.route"] === undefined) {
        root.setAttribute("http.route", route);
      }
    },
    forceFlush: () => Promise.resolve(),
    shutdown: () => Promise.resolve(),
  };
}

const config: ResolveConfigFn<Env> = (env) => {
  const exporter = new OTLPExporter({
    url: `${env.OTEL_EXPORTER_OTLP_ENDPOINT.replace(/\/$/, "")}/v1/traces`,
    headers: { Authorization: env.GRAFANA_OTEL_AUTH_HEADER },
  });
  return {
    spanProcessors: [makePropagateRouteProcessor(), new BatchTraceSpanProcessor(exporter)],
    service: {
      name: "darna-backend",
      namespace: env.OTEL_DEPLOYMENT_ENV ?? "production",
      version: "0.0.0",
    },
  };
};

export default instrument(handler, config);
