import { HttpApiBuilder, HttpServer, OpenApi } from "@effect/platform"
import { Hono } from "hono"
import { cors } from "hono/cors"
import { Scalar } from "@scalar/hono-api-reference"
import { Layer } from "effect"
import { Api } from "./api.js"
import { TodoHandlers } from "./features/todo/http/todo.handlers.js"
import { ProjectHandlers } from "./features/project/http/project.handlers.js"
import { AdminHandlers } from "./features/admin/admin.handlers.js"
import { TracingLayer } from "./lib/effect/tracing.js"

const ApiLive = HttpApiBuilder.api(Api).pipe(
  Layer.provide([TodoHandlers, ProjectHandlers, AdminHandlers]),
  Layer.provide(TracingLayer),
)

const { handler: apiHandler } = HttpApiBuilder.toWebHandler(
  Layer.mergeAll(
    ApiLive,
    HttpApiBuilder.Router.Live,
    HttpServer.layerContext,
  ),
)

const spec = OpenApi.fromApi(Api)

export const app = new Hono()
  .use("*", cors({ origin: (o) => o ?? "*", credentials: true }))
  .get("/health", (c) => c.json({ ok: true }))
  .get("/openapi", (c) => c.json(spec as object))
  .get("/docs", Scalar({ url: "/openapi", pageTitle: "Darna Backend — API" }))
  .all("/api/*", (c) => apiHandler(c.req.raw))

export type AppType = typeof app
