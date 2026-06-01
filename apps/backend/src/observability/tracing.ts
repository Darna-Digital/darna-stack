import { trace } from "@opentelemetry/api";
import * as Effect from "effect/Effect";
import { ExportResultCode, type ExportResult } from "@opentelemetry/core";
import { resourceFromAttributes } from "@opentelemetry/resources";
import {
  BasicTracerProvider,
  BatchSpanProcessor,
  type ReadableSpan,
  type SpanExporter,
  type SpanProcessor,
} from "@opentelemetry/sdk-trace-base";
import { JsonTraceSerializer } from "@opentelemetry/otlp-transformer";
import * as Layer from "effect/Layer";
import * as Resource from "@effect/opentelemetry/Resource";
import * as Tracer from "@effect/opentelemetry/Tracer";

const SERVICE_NAME = "darna-backend";

class FetchOtlpTraceExporter implements SpanExporter {
  private readonly url: string;
  private readonly headers: Record<string, string>;

  constructor(url: string, headers: Record<string, string>) {
    this.url = url;
    this.headers = headers;
  }

  export(spans: ReadableSpan[], resultCallback: (result: ExportResult) => void): void {
    const body = JsonTraceSerializer.serializeRequest(spans);
    if (body === undefined) {
      resultCallback({ code: ExportResultCode.SUCCESS });
      return;
    }
    fetch(this.url, {
      method: "POST",
      headers: { "content-type": "application/json", ...this.headers },
      body: new TextDecoder().decode(body),
    })
      .then((r) =>
        resultCallback({ code: r.ok ? ExportResultCode.SUCCESS : ExportResultCode.FAILED }),
      )
      .catch((error: Error) => resultCallback({ code: ExportResultCode.FAILED, error }));
  }

  shutdown(): Promise<void> {
    return Promise.resolve();
  }
  forceFlush(): Promise<void> {
    return Promise.resolve();
  }
}

let spanProcessor: SpanProcessor | undefined;

export const ensureTracingProvider = (
  endpoint: string,
  authHeader: string,
  namespace: string,
): SpanProcessor => {
  if (spanProcessor === undefined) {
    const exporter = new FetchOtlpTraceExporter(`${endpoint.replace(/\/+$/, "")}/v1/traces`, {
      Authorization: authHeader,
    });
    spanProcessor = new BatchSpanProcessor(exporter);
    trace.setGlobalTracerProvider(
      new BasicTracerProvider({
        resource: resourceFromAttributes({
          "service.name": SERVICE_NAME,
          "service.namespace": namespace,
        }),
        spanProcessors: [spanProcessor],
      }),
    );
  }
  return spanProcessor;
};

export const tracerBridge = (namespace: string) =>
  Tracer.layerGlobal.pipe(
    Layer.provide(
      Resource.layer({
        serviceName: SERVICE_NAME,
        attributes: { "service.namespace": namespace },
      }),
    ),
  );

interface OtelEnv {
  readonly OTEL_ENABLED?: unknown;
  readonly OTEL_EXPORTER_OTLP_ENDPOINT?: unknown;
  readonly GRAFANA_OTEL_AUTH_HEADER?: unknown;
  readonly OTEL_DEPLOYMENT_ENV?: unknown;
}

const decodeEnvString = (value: unknown): string => {
  if (typeof value !== "string") return value == null ? "" : String(value);
  const trimmed = value.trim();
  if (trimmed.length >= 2 && trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try {
      return String(JSON.parse(trimmed));
    } catch {
      return trimmed.slice(1, -1);
    }
  }
  return trimmed;
};

export const withWorkflowTracing =
  (label: string, env: OtelEnv, attributes?: Record<string, string | number | boolean>) =>
  <A, E, R>(effect: Effect.Effect<A, E, R>): Effect.Effect<A, E, R> =>
    Effect.gen(function* () {
      const endpoint = decodeEnvString(env.OTEL_EXPORTER_OTLP_ENDPOINT);
      const authHeader = decodeEnvString(env.GRAFANA_OTEL_AUTH_HEADER);
      const namespace = decodeEnvString(env.OTEL_DEPLOYMENT_ENV) || "development";
      const enabled = (decodeEnvString(env.OTEL_ENABLED) || "true") !== "false";

      const traced = effect.pipe(
        Effect.withSpan(label, { kind: "server", root: true, attributes }),
      );

      if (!enabled || endpoint === "" || authHeader === "") {
        return yield* traced;
      }

      const processor = ensureTracingProvider(endpoint, authHeader, namespace);
      const result = yield* traced.pipe(Effect.provide(tracerBridge(namespace)));
      yield* Effect.promise(() => processor.forceFlush());
      return result;
    });
