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

/** OTel config as it arrives on the Worker `env` (vars + secrets). */
interface OtelEnv {
  readonly OTEL_ENABLED?: unknown;
  readonly OTEL_EXPORTER_OTLP_ENDPOINT?: unknown;
  readonly GRAFANA_OTEL_AUTH_HEADER?: unknown;
  readonly OTEL_DEPLOYMENT_ENV?: unknown;
}

/**
 * Decode a raw `WorkerEnvironment` value. Alchemy binds `effect/Config` values
 * via `ConfigProvider.fromUnknown`, which JSON-encodes them — so a string
 * arrives quoted (e.g. `"\"https://…\""`). The Worker's `fetch` path reads them
 * back through `Config`, but a workflow reads `env` directly, so we decode here.
 */
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

/**
 * Wrap a Cloudflare Workflow body in a traced root span. Unlike the Worker's
 * `fetch` (which flushes via `ctx.waitUntil`), a workflow run can simply await
 * the flush before returning, so spans ship reliably for each run segment.
 *
 * Reads OTel config straight off `WorkerEnvironment` (the workflow shares the
 * Worker's bound vars/secrets). When tracing is off or unconfigured, the body
 * still runs with the default no-op tracer — `withSpan` never adds a service
 * requirement, so the effect's `R` is unchanged either way.
 */
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
      // Ship spans before the run segment returns (workflows may await freely).
      yield* Effect.promise(() => processor.forceFlush());
      return result;
    });
