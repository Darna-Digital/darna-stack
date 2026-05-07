import { OtlpSerialization, OtlpTracer, Resource, Tracer } from "@effect/opentelemetry";
import { FetchHttpClient } from "@effect/platform";
import { Layer } from "effect";

// Two-mode tracing:
//
// 1. Local Node dev (`pnpm dev`) — when OTEL_EXPORTER_OTLP_ENDPOINT
//    + GRAFANA_OTEL_AUTH_HEADER are set in process.env, push spans straight to
//    Grafana via OtlpTracer.layer. The 5s batch interval is fine on Node.
//
// 2. Cloudflare Worker (`wrangler dev` and prod) — those vars are NOT in
//    process.env (Workers expose env via the fetch handler arg, not process),
//    so we fall through to Tracer.layerGlobalTracer. The Worker entrypoint is
//    wrapped with @microlabs/otel-cf-workers `instrument(...)`, which registers
//    a real OTel TracerProvider on the global API per request and flushes spans
//    via ctx.waitUntil before the isolate suspends. Effect's spans flow through
//    that provider alongside the auto-instrumented inbound fetch, Hyperdrive,
//    and subrequest spans.
const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
const authHeader = process.env.GRAFANA_OTEL_AUTH_HEADER;
const deploymentEnv = process.env.OTEL_DEPLOYMENT_ENV ?? "local";

const resourceConfig = {
  serviceName: "darna-backend",
  serviceVersion: "0.0.0",
  attributes: {
    "deployment.environment": deploymentEnv,
  } as Record<string, string>,
};

if (endpoint && authHeader) {
  console.log(`[tracing] OTLP direct push → ${endpoint} (env=${deploymentEnv})`);
} else {
  console.log(`[tracing] global tracer — @microlabs/otel-cf-workers handles export`);
}

export const TracingLayer: Layer.Layer<never> =
  endpoint && authHeader
    ? OtlpTracer.layer({
        url: `${endpoint.replace(/\/$/, "")}/v1/traces`,
        headers: { Authorization: authHeader },
        resource: resourceConfig,
      }).pipe(Layer.provide(OtlpSerialization.layerJson), Layer.provide(FetchHttpClient.layer))
    : Tracer.layerWithoutOtelTracer.pipe(
        Layer.provide(Tracer.layerGlobalTracer),
        Layer.provide(Resource.layer(resourceConfig)),
      );
