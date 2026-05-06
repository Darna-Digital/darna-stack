import {
  OtlpSerialization,
  OtlpTracer,
  Resource,
  Tracer,
} from "@effect/opentelemetry"
import { FetchHttpClient } from "@effect/platform"
import { Layer } from "effect"

// Two-mode tracing:
//
// 1. Local dev (Node, has direct internet access) — when OTEL_EXPORTER_OTLP_ENDPOINT
//    + GRAFANA_OTEL_AUTH_HEADER are set, we push spans straight to Grafana via
//    OtlpTracer.layer. The 5s batch interval works fine on Node.
//
// 2. Cloudflare Worker (production) — those env vars are intentionally NOT set
//    in CF so we fall through to Tracer.layerGlobalTracer. That registers Effect's
//    Tracer with the global OpenTelemetry API. Cloudflare Workers Observability
//    auto-injects a SpanProcessor on the global TracerProvider and forwards
//    spans through the telemetry destinations registered in the dashboard
//    (see wrangler.jsonc `observability.traces.destinations`). No buffer/flush
//    problem because Cloudflare's edge does the export, not the Worker isolate.
//
// Either way Effect.withSpan calls land in the same Grafana stack — the only
// difference is who does the HTTP push.
const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
const authHeader = process.env.GRAFANA_OTEL_AUTH_HEADER
const deploymentEnv = process.env.OTEL_DEPLOYMENT_ENV ?? "local"

const resourceConfig = {
  serviceName: "darna-backend",
  serviceVersion: "0.0.0",
  attributes: {
    "deployment.environment": deploymentEnv,
  } as Record<string, string>,
}

if (endpoint && authHeader) {
  console.log(
    `[tracing] OTLP direct push → ${endpoint} (env=${deploymentEnv})`,
  )
} else {
  console.log(
    `[tracing] global tracer — Cloudflare Observability handles export (env=${deploymentEnv})`,
  )
}

export const TracingLayer: Layer.Layer<never> =
  endpoint && authHeader
    ? OtlpTracer.layer({
        url: `${endpoint.replace(/\/$/, "")}/v1/traces`,
        headers: { Authorization: authHeader },
        resource: resourceConfig,
      }).pipe(
        Layer.provide(OtlpSerialization.layerJson),
        Layer.provide(FetchHttpClient.layer),
      )
    : Tracer.layerWithoutOtelTracer.pipe(
        Layer.provide(Tracer.layerGlobalTracer),
        Layer.provide(Resource.layer(resourceConfig)),
      )
