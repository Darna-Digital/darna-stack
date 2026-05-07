import { OtlpSerialization, OtlpTracer, Resource, Tracer } from "@effect/opentelemetry";
import { FetchHttpClient } from "@effect/platform";
import { trace, type Tracer as OtelTracer } from "@opentelemetry/api";
import { Layer } from "effect";

// Two-mode tracing:
//
// 1. Local Node dev (`pnpm dev`) — when OTEL_EXPORTER_OTLP_ENDPOINT
//    + GRAFANA_OTEL_AUTH_HEADER are set in process.env, push spans straight to
//    Grafana via OtlpTracer.layer. The 5s batch interval is fine on Node.
//
// 2. Cloudflare Worker (`wrangler dev` and prod) — those vars are NOT in
//    process.env, so we fall through to a lazy global-tracer layer. The Worker
//    entrypoint is wrapped with @microlabs/otel-cf-workers `instrument(...)`,
//    which calls `trace.setGlobalTracerProvider(...)` per request and flushes
//    spans via ctx.waitUntil. We can't use `Tracer.layerGlobalTracer` directly:
//    it captures `trace.getTracerProvider()` at layer-build time (which on
//    Workers is module load), so it captures the noop provider before
//    @microlabs has registered the real one. Instead, wrap the global API in
//    a tracer that re-resolves `trace.getTracer(...)` on every startSpan call.
// On Workers, `nodejs_compat` exposes vars/secrets through process.env, so we
// can't use "endpoint set in process.env?" as the discriminator for the OTLP
// direct-push branch. Detect the Workers runtime explicitly and force the
// global-tracer branch there — OtlpTracer.layer batches at 5s and the isolate
// freezes after the response, which silently drops Effect spans.
const isWorker =
  (globalThis as { navigator?: { userAgent?: string } }).navigator?.userAgent ===
  "Cloudflare-Workers";

const endpoint = isWorker ? undefined : process.env.OTEL_EXPORTER_OTLP_ENDPOINT;
const authHeader = isWorker ? undefined : process.env.GRAFANA_OTEL_AUTH_HEADER;
const deploymentEnv = process.env.OTEL_DEPLOYMENT_ENV ?? "local";

const SERVICE_NAME = "darna-backend";
const SERVICE_VERSION = "0.0.0";

const resourceConfig = {
  serviceName: SERVICE_NAME,
  serviceVersion: SERVICE_VERSION,
  attributes: {
    "deployment.environment": deploymentEnv,
  } as Record<string, string>,
};

const lazyOtelTracer: OtelTracer = {
  startSpan: (...args) => trace.getTracer(SERVICE_NAME, SERVICE_VERSION).startSpan(...args),
  startActiveSpan: ((...args: Parameters<OtelTracer["startActiveSpan"]>) =>
    (
      trace.getTracer(SERVICE_NAME, SERVICE_VERSION).startActiveSpan as (...a: unknown[]) => unknown
    )(...args)) as OtelTracer["startActiveSpan"],
};

const layerLazyTracer = Layer.succeed(Tracer.OtelTracer, lazyOtelTracer);

if (endpoint && authHeader) {
  console.log(`[tracing] OTLP direct push → ${endpoint} (env=${deploymentEnv})`);
} else {
  console.log(`[tracing] global tracer (lazy) — @microlabs/otel-cf-workers handles export`);
}

export const TracingLayer: Layer.Layer<never> =
  endpoint && authHeader
    ? OtlpTracer.layer({
        url: `${endpoint.replace(/\/$/, "")}/v1/traces`,
        headers: { Authorization: authHeader },
        resource: resourceConfig,
      }).pipe(Layer.provide(OtlpSerialization.layerJson), Layer.provide(FetchHttpClient.layer))
    : Tracer.layerWithoutOtelTracer.pipe(
        Layer.provide(layerLazyTracer),
        Layer.provide(Resource.layer(resourceConfig)),
      );
