import { OtlpSerialization, OtlpTracer } from "@effect/opentelemetry"
import { FetchHttpClient } from "@effect/platform"
import { Layer } from "effect"

const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
const instanceId = process.env.GRAFANA_OTEL_INSTANCE_ID
const apiToken = process.env.GRAFANA_OTEL_API_TOKEN

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
            "deployment.environment":
              process.env.OTEL_DEPLOYMENT_ENV ?? "local",
          },
        },
      }).pipe(
        Layer.provide(OtlpSerialization.layerJson),
        Layer.provide(FetchHttpClient.layer),
      )
    : Layer.empty
