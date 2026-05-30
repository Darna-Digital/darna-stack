import { trace } from "@opentelemetry/api";
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

/**
 * Minimal OTLP/HTTP + JSON span exporter that POSTs via `fetch`. Unlike
 * `@microlabs/otel-cf-workers`, it imports nothing Workers-only (`cloudflare:`),
 * so the stack still loads under Node at deploy/plan time.
 */
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

// Built ONCE per isolate — like backend-old's global OpenTelemetry SDK. We hold
// the SpanProcessor so the worker can `forceFlush()` it per request via
// `ctx.waitUntil` (the only reliable way to ship spans on Cloudflare Workers).
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

/**
 * Installs Effect's tracer backed by the global OTel provider — cheap to build
 * per request. NOTE: must be `layerGlobal` (installs `Tracer.Tracer`), NOT
 * `layerGlobalTracer` (only exposes the OtelTracer service → `withSpan` would
 * fall back to the no-op tracer and emit nothing).
 */
export const tracerBridge = (namespace: string) =>
  Tracer.layerGlobal.pipe(
    Layer.provide(
      Resource.layer({
        serviceName: SERVICE_NAME,
        attributes: { "service.namespace": namespace },
      }),
    ),
  );
