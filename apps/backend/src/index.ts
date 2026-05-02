import { serve } from "@hono/node-server"
import { app } from "./server.js"

const port = Number(process.env.PORT ?? 4000)

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`@darna/backend listening on http://localhost:${info.port}`)
  console.log(`  health     → http://localhost:${info.port}/health`)
  console.log(`  docs       → http://localhost:${info.port}/docs`)
  console.log(`  openapi    → http://localhost:${info.port}/openapi`)
  console.log(`  todos      → http://localhost:${info.port}/todos`)
})
