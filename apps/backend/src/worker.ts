import * as Cloudflare from "alchemy/Cloudflare";
import * as Drizzle from "alchemy/Drizzle";
import * as Cause from "effect/Cause";
import * as Config from "effect/Config";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";
import { HttpApiBuilder, HttpApiScalar } from "effect/unstable/httpapi";
import { HttpRouter, HttpServer } from "effect/unstable/http";
import * as HttpServerRequest from "effect/unstable/http/HttpServerRequest";
import * as HttpServerResponse from "effect/unstable/http/HttpServerResponse";
import * as HttpMiddleware from "effect/unstable/http/HttpMiddleware";
import { Api } from "./api.ts";
import { GreetingsHandlers } from "./greetings/greetings.handlers.ts";
import { UsersHandlers } from "./users/users.handlers.ts";
import { WorkflowsHandlers } from "./workflows/workflows.handlers.ts";
import { makeAuth } from "./auth/better-auth.ts";
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

    // better-auth config. On `alchemy deploy` these are resolved from the
    // environment and bound as Worker vars/secrets. In local `alchemy dev` the
    // Worker runs in local workerd and those bindings are NOT injected, so every
    // value MUST have a usable default — otherwise a required Config fails the
    // Worker's init effect and *every* route 500s. The defaults below are the
    // local-dev values (worker on :1337, web client on :7001, a fixed insecure
    // dev secret); production overrides them via the deploy-time bindings.
    const authBaseUrl = yield* Config.string("BETTER_AUTH_URL").pipe(
      Config.withDefault("http://localhost:1337"),
    );
    const webClientUrl = yield* Config.string("WEB_CLIENT_URL").pipe(
      Config.withDefault("http://localhost:7001"),
    );
    const authCookieDomain = yield* Config.string("AUTH_COOKIE_DOMAIN").pipe(
      Config.withDefault(""),
    );
    const authSecret = Redacted.value(
      yield* Config.redacted("BETTER_AUTH_SECRET").pipe(
        Config.withDefault(Redacted.make("local-dev-insecure-secret-change-in-production")),
      ),
    );

    // Build better-auth lazily (and memoize via `Effect.cached`) on first
    // request. The Hyperdrive connection string can only be resolved at runtime,
    // not at plan/deploy time — `Effect.cached` does NOT run the inner effect
    // until `getAuth` is first yielded, so plan-time evaluation never touches
    // the (absent) binding. The pg pool is then created at most once per isolate.
    const getAuth = yield* Effect.cached(
      Effect.gen(function* () {
        const connectionString = Redacted.value(yield* conn.connectionString);
        return makeAuth({
          connectionString,
          secret: authSecret,
          baseURL: authBaseUrl,
          webClientUrl,
          cookieDomain: authCookieDomain,
        });
      }),
    );

    const apiHandler = yield* HttpRouter.toHttpEffect(
      ApiLive.pipe(
        Layer.provide(Layer.succeed(Database, db)),
        Layer.provide(Layer.succeed(GreetingWorkflowService, greetingWorkflow)),
      ),
    );

    // CORS reflects trusted origins with credentials so the cross-origin web
    // client can carry the session cookie.
    const allowOrigin = (origin: string): boolean =>
      /^http:\/\/localhost(:\d+)?$/.test(origin) ||
      webClientUrl
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
        .includes(origin);

    const routed = Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest;
      const path = new URL(request.url, "http://x").pathname;

      // better-auth owns /api/auth/* (sign-in/up/out, verify, reset, session...).
      if (path.startsWith("/api/auth/")) {
        const auth = yield* getAuth;
        // Reconstruct a real web `Request` (incl. body) for better-auth. Using
        // `request.source` directly is unsafe — it's an opaque platform object.
        const webRequest = yield* Effect.fromResult(HttpServerRequest.toWebResult(request));
        const response = yield* Effect.promise(() => auth.handler(webRequest));
        return HttpServerResponse.fromWeb(response);
      }

      // App-level "who am I": the better-auth session user, or null.
      if (path === "/api/me") {
        const auth = yield* getAuth;
        const headers = new Headers(request.headers as Record<string, string>);
        const result = yield* Effect.promise(() => auth.api.getSession({ headers }));
        return yield* HttpServerResponse.json(
          result
            ? {
                id: result.user.id,
                email: result.user.email,
                name: result.user.name,
                emailVerified: result.user.emailVerified,
                image: result.user.image ?? null,
              }
            : null,
        );
      }

      return yield* apiHandler;
    }).pipe(
      // Turn unexpected failures/defects (e.g. better-auth throwing) into a 500
      // *inside* the CORS wrapper, so the response still carries
      // Access-Control-Allow-Origin instead of surfacing in the browser as an
      // opaque CORS error. The real cause is logged to the alchemy dev console.
      Effect.catchCause((cause) =>
        Effect.sync(() => console.error("[routed] handler failed:\n" + Cause.pretty(cause))).pipe(
          Effect.as(HttpServerResponse.text("Internal Server Error", { status: 500 })),
        ),
      ),
    );

    const handler = HttpMiddleware.cors({
      allowedOrigins: allowOrigin,
      allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })(routed).pipe(
      // Outer net: catch anything thrown at the CORS/runtime boundary (before
      // `routed` runs) so it's logged instead of escaping as an opaque workerd
      // `[object Object]` uncaught exception.
      Effect.catchCause((cause) =>
        Effect.sync(() => console.error("[boundary] fetch failed:\n" + Cause.pretty(cause))).pipe(
          Effect.as(HttpServerResponse.text("Internal Server Error", { status: 500 })),
        ),
      ),
    );

    const tracingOn = otelEnabled && endpoint !== "" && authHeader !== "";

    return {
      fetch: tracingOn
        ? Effect.gen(function* () {
            const request = yield* HttpServerRequest.HttpServerRequest;
            if (sampleRate < 1 && Math.random() >= sampleRate) {
              return yield* handler;
            }
            // Global OTel provider, built once per isolate (backend-old's model).
            // We hold the SpanProcessor to forceFlush it per request via waitUntil.
            const processor = ensureTracingProvider(endpoint, authHeader, namespace);
            const ctx = yield* Cloudflare.WorkerExecutionContext;
            const path = new URL(request.url, "http://x").pathname;

            const response = yield* handler.pipe(
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
        : handler,
    };
  }).pipe(
    Effect.provide(Layer.mergeAll(Cloudflare.HyperdriveBindingLive, HttpServer.layerServices)),
  ),
) {}
