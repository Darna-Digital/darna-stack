import { OtlpSerialization, OtlpTracer } from "@effect/opentelemetry"
import { FetchHttpClient } from "@effect/platform"
import { Layer } from "effect"

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
const authHeader = process.env.GRAFANA_OTEL_AUTH_HEADER
const deploymentEnv = process.env.OTEL_DEPLOYMENT_ENV ?? "local"

if (endpoint && authHeader) {
  console.log(
    `[tracing] OTLP enabled → ${endpoint} (env=${deploymentEnv})`,
  )
} else {
  const missing = [
    !endpoint && "OTEL_EXPORTER_OTLP_ENDPOINT",
    !authHeader && "GRAFANA_OTEL_AUTH_HEADER",
  ]
    .filter(Boolean)
    .join(", ")
  console.log(`[tracing] OTLP disabled — missing: ${missing}`)
}

export const TracingLayer: Layer.Layer<never> =
  endpoint && authHeader
    ? OtlpTracer.layer({
        url: `${endpoint.replace(/\/$/, "")}/v1/traces`,
        headers: {
          Authorization: authHeader,
        },
        resource: {
          serviceName: "darna-backend",
          serviceVersion: "0.0.0",
          attributes: {
            "deployment.environment": deploymentEnv,
          },
        },
      }).pipe(
        Layer.provide(OtlpSerialization.layerJson),
        Layer.provide(FetchHttpClient.layer),
      )
    : Layer.empty
