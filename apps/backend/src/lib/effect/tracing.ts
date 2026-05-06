import { OtlpSerialization, OtlpTracer } from "@effect/opentelemetry"
import { FetchHttpClient } from "@effect/platform"
import { Layer } from "effect"

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
const instanceId = process.env.GRAFANA_OTEL_INSTANCE_ID
const apiToken = process.env.GRAFANA_OTEL_API_TOKEN
const deploymentEnv = process.env.OTEL_DEPLOYMENT_ENV ?? "local"

if (endpoint && instanceId && apiToken) {
  console.log(
    `[tracing] OTLP enabled → ${endpoint} (env=${deploymentEnv}, instance=${instanceId})`,
  )
} else {
  const missing = [
    !endpoint && "OTEL_EXPORTER_OTLP_ENDPOINT",
    !instanceId && "GRAFANA_OTEL_INSTANCE_ID",
    !apiToken && "GRAFANA_OTEL_API_TOKEN",
  ]
    .filter(Boolean)
    .join(", ")
  console.log(`[tracing] OTLP disabled — missing: ${missing}`)
}

export const TracingLayer: Layer.Layer<never> =
  endpoint && instanceId && apiToken
    ? OtlpTracer.layer({
        url: `${endpoint.replace(/\/$/, "")}/v1/traces`,
        headers: {
          Authorization: `Basic ${btoa(`${instanceId}:${apiToken}`)}`,
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
