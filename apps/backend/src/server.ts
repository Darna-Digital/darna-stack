import { Hono } from "hono"
import { openAPIRouteHandler } from "hono-openapi"
import { Scalar } from "@scalar/hono-api-reference"
import { todoRoutes } from "@/features/todo/todo.routes.js"
import { adminRoutes } from "@/features/admin/admin.routes.js"

// TODO: add CorsMiddleware, LoggerMiddleware, ErrorMiddleware (see opencode/server/middleware.ts)

export const app = new Hono()
  .get("/health", (c) => c.json({ ok: true }))
  .route("/todos", todoRoutes)
  .route("/admin", adminRoutes)

app.get(
  "/openapi",
  openAPIRouteHandler(app, {
    documentation: {
      info: { title: "Darna Backend", version: "0.0.0" },
      openapi: "3.1.0",
    },
  }),
)

app.get("/docs", Scalar({ url: "/openapi", pageTitle: "Darna Backend — API" }))

export type AppType = typeof app
