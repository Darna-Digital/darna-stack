import { Resource, Tracer } from "@effect/opentelemetry";
import { trace, type Tracer as OtelTracer } from "@opentelemetry/api";
import { Layer } from "effect";

// The Worker entrypoint is wrapped with @microlabs/otel-cf-workers `instrument(...)`,
// which calls `trace.setGlobalTracerProvider(...)` per request and flushes spans
// via ctx.waitUntil. We can't use `Tracer.layerGlobalTracer` directly: it captures
// `trace.getTracerProvider()` at layer-build time (module load), which on Workers
// is BEFORE @microlabs has registered the real provider. Instead, wrap the global
// API in a tracer that re-resolves `trace.getTracer(...)` on every startSpan call.

const SERVICE_NAME = "darna-backend";
const SERVICE_VERSION = "0.0.0";

const resourceConfig = {
  serviceName: SERVICE_NAME,
  serviceVersion: SERVICE_VERSION,
};

const lazyOtelTracer: OtelTracer = {
  startSpan: (...args) => trace.getTracer(SERVICE_NAME, SERVICE_VERSION).startSpan(...args),
  startActiveSpan: ((...args: Parameters<OtelTracer["startActiveSpan"]>) =>
    (
      trace.getTracer(SERVICE_NAME, SERVICE_VERSION).startActiveSpan as (...a: unknown[]) => unknown
    )(...args)) as OtelTracer["startActiveSpan"],
};

const layerLazyTracer = Layer.succeed(Tracer.OtelTracer, lazyOtelTracer);

export const TracingLayer: Layer.Layer<never> = Tracer.layerWithoutOtelTracer.pipe(
  Layer.provide(layerLazyTracer),
  Layer.provide(Resource.layer(resourceConfig)),
);
