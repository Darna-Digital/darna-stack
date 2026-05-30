import * as Layer from "effect/Layer";
import { HttpApiBuilder, OpenApi } from "effect/unstable/httpapi";
import { HttpRouter, HttpServer } from "effect/unstable/http";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { Scalar } from "@scalar/hono-api-reference";
import { Api } from "./api.ts";
import { GreetingsHandlers } from "./greetings/greetings.handlers.ts";

// Build the Effect HTTP API layer: endpoints + handlers + platform services.
const ApiLayer = HttpApiBuilder.layer(Api).pipe(
  Layer.provide(GreetingsHandlers),
  Layer.provide(HttpServer.layerServices),
);

// Compile the Effect API into a standard web fetch handler.
const { handler: apiHandler } = HttpRouter.toWebHandler(ApiLayer);

// OpenAPI spec is generated from the Effect API definition.
const spec = OpenApi.fromApi(Api);

export const app = new Hono()
  .use("*", cors())
  .get("/health", (c) => c.json({ ok: true }))
  .get("/openapi", (c) => c.json(spec as object))
  .get("/docs", Scalar({ url: "/openapi", pageTitle: "Darna Backend — API" }))
  .all("/api/*", (c) => apiHandler(c.req.raw));

export type AppType = typeof app;
