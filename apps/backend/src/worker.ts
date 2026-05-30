import * as Cloudflare from "alchemy/Cloudflare";
import * as Drizzle from "alchemy/Drizzle";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";
import { HttpApiBuilder, HttpApiScalar } from "effect/unstable/httpapi";
import { HttpRouter, HttpServer } from "effect/unstable/http";
import * as HttpServerRequest from "effect/unstable/http/HttpServerRequest";
import { Api } from "./api.ts";
import { GreetingsHandlers } from "./greetings/greetings.handlers.ts";
import { UsersHandlers } from "./users/users.handlers.ts";
import { WorkflowsHandlers } from "./workflows/workflows.handlers.ts";
import GreetingWorkflow, { GreetingWorkflowService } from "./workflows/greeting.workflow.ts";
import { Database } from "./db/database.ts";
import { Hyperdrive } from "./db/Db.ts";
import { ensureTracingProvider, tracerBridge } from "./observability/tracing.ts";

// The API as a router layer: endpoints + handlers + OpenAPI spec + Scalar docs.
const ApiLive = Layer.mergeAll(
  HttpApiBuilder.layer(Api, { openapiPath: "/openapi.json" }),
  HttpApiScalar.layer(Api, { path: "/docs" }),
).pipe(
  Layer.provide(GreetingsHandlers),
  Layer.provide(UsersHandlers),
  Layer.provide(WorkflowsHandlers),
);

export default class Worker extends Cloudflare.Worker<Worker>()(
  "Api",
  { main: import.meta.filename, url: true },
  Effect.gen(function* () {
    const conn = yield* Cloudflare.Hyperdrive.bind(Hyperdrive);
    const db = yield* Drizzle.postgres(conn.connectionString);

    // Bind the example workflow: registers the binding + Workflows API resource
    // and yields a handle the API handlers use to start/poll instances.
    const greetingWorkflow = yield* GreetingWorkflow;

    // OTel config via effect/Config (resolved in Init = bound as worker secrets).
    const otelEnabled = yield* Config.boolean("OTEL_ENABLED").pipe(Config.withDefault(true));
    const sampleRate = yield* Config.number("OTEL_SAMPLE_RATE").pipe(Config.withDefault(1));
    const endpoint = yield* Config.string("OTEL_EXPORTER_OTLP_ENDPOINT").pipe(
      Config.withDefault(""),
    );
    const authHeader = Redacted.value(
      yield* Config.redacted("GRAFANA_OTEL_AUTH_HEADER").pipe(
        Config.withDefault(Redacted.make("")),
      ),
    );
    const namespace = yield* Config.string("OTEL_DEPLOYMENT_ENV").pipe(
      Config.withDefault("development"),
    );

    const apiHandler = yield* HttpRouter.toHttpEffect(
      ApiLive.pipe(
        Layer.provide(Layer.succeed(Database, db)),
        Layer.provide(Layer.succeed(GreetingWorkflowService, greetingWorkflow)),
      ),
    );

    const tracingOn = otelEnabled && endpoint !== "" && authHeader !== "";

    return {
      fetch: tracingOn
        ? Effect.gen(function* () {
            const request = yield* HttpServerRequest.HttpServerRequest;
            if (sampleRate < 1 && Math.random() >= sampleRate) {
              return yield* apiHandler;
            }
            // Global OTel provider, built once per isolate (backend-old's model).
            // We hold the SpanProcessor to forceFlush it per request via waitUntil.
            const processor = ensureTracingProvider(endpoint, authHeader, namespace);
            const ctx = yield* Cloudflare.WorkerExecutionContext;
            const path = new URL(request.url, "http://x").pathname;

            const response = yield* apiHandler.pipe(
              // Root span — don't continue Cloudflare's injected `traceparent`.
              Effect.withSpan(`${request.method} ${path}`, {
                kind: "server",
                root: true,
                attributes: { "http.request.method": request.method, "url.path": path },
              }),
              Effect.provide(tracerBridge(namespace)),
            );

            // Ship spans without blocking the response (kept alive by waitUntil).
            ctx.waitUntil(processor.forceFlush());
            return response;
          })
        : apiHandler,
    };
  }).pipe(
    Effect.provide(Layer.mergeAll(Cloudflare.HyperdriveBindingLive, HttpServer.layerServices)),
  ),
) {}
