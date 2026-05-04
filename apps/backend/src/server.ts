import { Hono } from "hono"
import { cors } from "hono/cors"
import { RPCHandler } from "@orpc/server/fetch"
import { OpenAPIHandler } from "@orpc/openapi/fetch"
import { OpenAPIGenerator } from "@orpc/openapi"
import { ZodToJsonSchemaConverter } from "@orpc/zod/zod4"
import { Scalar } from "@scalar/hono-api-reference"
import { router } from "./router.js"

const rpc = new RPCHandler(router)
const openapi = new OpenAPIHandler(router)

const generator = new OpenAPIGenerator({
  schemaConverters: [new ZodToJsonSchemaConverter()],
})

let cachedSpec: Promise<unknown> | null = null
const getSpec = () => {
  if (!cachedSpec) {
    cachedSpec = generator.generate(router, {
      info: { title: "Darna Backend", version: "0.0.0" },
      servers: [{ url: "/api" }],
    })
  }
  return cachedSpec
}

export const app = new Hono()
  .use("*", cors({ origin: (o) => o ?? "*", credentials: true }))
  .get("/health", (c) => c.json({ ok: true }))
  .get("/openapi", async (c) => c.json((await getSpec()) as object))
  .get("/docs", Scalar({ url: "/openapi", pageTitle: "Darna Backend — API" }))
  .all("/api/*", async (c) => {
    const { matched, response } = await openapi.handle(c.req.raw, {
      prefix: "/api",
      context: { request: c.req.raw },
    })
    if (matched) return response
    return c.notFound()
  })
  .all("/rpc/*", async (c) => {
    const { matched, response } = await rpc.handle(c.req.raw, {
      prefix: "/rpc",
      context: { request: c.req.raw },
    })
    if (matched) return response
    return c.notFound()
  })

export type AppType = typeof app
