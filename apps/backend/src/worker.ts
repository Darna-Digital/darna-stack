import * as Cloudflare from "alchemy/Cloudflare";
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
import { GreetingsController } from "./features/greetings/greetings.controller.ts";
import { ProjectsController } from "./features/projects/http/project.controller.ts";
import { ProjectTasksController } from "./features/tasks/http/project-task.controller.ts";
import { TasksController } from "./features/tasks/http/task.controller.ts";
import { ProjectsLive } from "./features/projects/layer/project.layer.live.ts";
import { TasksLive } from "./features/tasks/layer/task.layer.live.ts";
import { makeRawSqlLive } from "./layers/db/database.layer.ts";
import { makeAuth, setAuthInstance } from "./features/auth/better-auth.ts";
import { AuthenticationLive } from "./features/auth/auth.middleware.live.ts";
import TaskNotificationWorkflow, {
  TaskNotificationWorkflowService,
} from "./features/tasks/workflow/task-notification.workflow.ts";
import { Hyperdrive } from "./layers/db/db-iac.ts";
import { ensureTracingProvider, tracerBridge } from "./observability/tracing.ts";

const ApiLive = Layer.mergeAll(
  HttpApiBuilder.layer(Api, { openapiPath: "/openapi.json" }),
  HttpApiScalar.layer(Api, { path: "/docs" }),
).pipe(
  Layer.provide(GreetingsController),
  Layer.provide(ProjectsController),
  Layer.provide(ProjectTasksController),
  Layer.provide(TasksController),
);

const loadConfig = Effect.gen(function* () {
  const otelEnabled = yield* Config.boolean("OTEL_ENABLED").pipe(Config.withDefault(true));
  const sampleRate = yield* Config.number("OTEL_SAMPLE_RATE").pipe(Config.withDefault(1));
  const endpoint = yield* Config.string("OTEL_EXPORTER_OTLP_ENDPOINT").pipe(Config.withDefault(""));
  const authHeader = Redacted.value(
    yield* Config.redacted("GRAFANA_OTEL_AUTH_HEADER").pipe(Config.withDefault(Redacted.make(""))),
  );
  const namespace = yield* Config.string("OTEL_DEPLOYMENT_ENV").pipe(
    Config.withDefault("development"),
  );
  const authBaseUrl = yield* Config.string("BETTER_AUTH_URL").pipe(
    Config.withDefault("http://localhost:1337"),
  );
  const webClientUrl = yield* Config.string("WEB_CLIENT_URL").pipe(
    Config.withDefault("http://localhost:7001"),
  );
  const authCookieDomain = yield* Config.string("AUTH_COOKIE_DOMAIN").pipe(Config.withDefault(""));
  const authSecret = Redacted.value(
    yield* Config.redacted("BETTER_AUTH_SECRET").pipe(
      Config.withDefault(Redacted.make("local-dev-insecure-secret-change-in-production")),
    ),
  );

  return {
    otelEnabled,
    sampleRate,
    endpoint,
    authHeader,
    namespace,
    authBaseUrl,
    webClientUrl,
    authCookieDomain,
    authSecret,
  };
});

const makeAllowOrigin =
  (webClientUrl: string) =>
  (origin: string): boolean =>
    /^http:\/\/localhost(:\d+)?$/.test(origin) ||
    webClientUrl
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .includes(origin);

const recover500 = (label: string) =>
  Effect.catchCause((cause: Cause.Cause<unknown>) =>
    Effect.sync(() => console.error(`[${label}] failed:\n${Cause.pretty(cause)}`)).pipe(
      Effect.as(HttpServerResponse.text("Internal Server Error", { status: 500 })),
    ),
  );

export default class Worker extends Cloudflare.Worker<Worker>()(
  "Api",
  { main: import.meta.filename, url: true },
  Effect.gen(function* () {
    const conn = yield* Cloudflare.Hyperdrive.bind(Hyperdrive);
    const RawSqlLive = yield* makeRawSqlLive(conn.connectionString);
    const taskNotificationWorkflow = yield* TaskNotificationWorkflow;
    const cfg = yield* loadConfig;

    const getAuth = yield* Effect.cached(
      Effect.gen(function* () {
        const connectionString = Redacted.value(yield* conn.connectionString);
        const auth = makeAuth({
          connectionString,
          secret: cfg.authSecret,
          baseURL: cfg.authBaseUrl,
          webClientUrl: cfg.webClientUrl,
          cookieDomain: cfg.authCookieDomain,
        });
        setAuthInstance(auth);
        return auth;
      }),
    );

    const apiHandler = yield* HttpRouter.toHttpEffect(
      ApiLive.pipe(
        Layer.provide(AuthenticationLive),
        HttpRouter.provideRequest(
          Layer.mergeAll(ProjectsLive, TasksLive).pipe(
            Layer.provide(Layer.succeed(TaskNotificationWorkflowService, taskNotificationWorkflow)),
            Layer.provide(RawSqlLive),
          ),
        ),
      ),
    );

    const routed = Effect.gen(function* () {
      const request = yield* HttpServerRequest.HttpServerRequest;
      const path = new URL(request.url, "http://x").pathname;

      if (path.startsWith("/api/auth/")) {
        const auth = yield* getAuth;
        const webRequest = yield* Effect.fromResult(HttpServerRequest.toWebResult(request));
        const response = yield* Effect.promise(() => auth.handler(webRequest));
        return HttpServerResponse.fromWeb(response);
      }

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

      yield* getAuth;
      return yield* apiHandler;
    }).pipe(recover500("routed"));

    const handler = HttpMiddleware.cors({
      allowedOrigins: makeAllowOrigin(cfg.webClientUrl),
      allowedMethods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: true,
    })(routed).pipe(recover500("boundary"));

    const tracingOn = cfg.otelEnabled && cfg.endpoint !== "" && cfg.authHeader !== "";

    return {
      fetch: tracingOn
        ? Effect.gen(function* () {
            const request = yield* HttpServerRequest.HttpServerRequest;
            if (cfg.sampleRate < 1 && Math.random() >= cfg.sampleRate) {
              return yield* handler;
            }
            const processor = ensureTracingProvider(cfg.endpoint, cfg.authHeader, cfg.namespace);
            const ctx = yield* Cloudflare.WorkerExecutionContext;
            const path = new URL(request.url, "http://x").pathname;

            const response = yield* handler.pipe(
              Effect.withSpan(`${request.method} ${path}`, {
                kind: "server",
                root: true,
                attributes: { "http.request.method": request.method, "url.path": path },
              }),
              Effect.provide(tracerBridge(cfg.namespace)),
            );

            ctx.waitUntil(processor.forceFlush());
            return response;
          })
        : handler,
    };
  }).pipe(
    Effect.provide(Layer.mergeAll(Cloudflare.HyperdriveBindingLive, HttpServer.layerServices)),
  ),
) {}
