import { Hono } from "hono"
import { openAPIRouteHandler } from "hono-openapi"
import { todoRoutes } from "@/features/todo/todo.routes.js"

// TODO: add CorsMiddleware, LoggerMiddleware, ErrorMiddleware (see opencode/server/middleware.ts)
// TODO: add AuthMiddleware that resolves CurrentUser into the Effect context

export const app = new Hono()
  .get("/health", (c) => c.json({ ok: true }))
  .route("/todos", todoRoutes)

app.get(
  "/openapi",
  openAPIRouteHandler(app, {
    documentation: {
      info: { title: "Darna Backend", version: "0.0.0" },
      openapi: "3.1.0",
    },
  }),
)

export type AppType = typeof app
