import { serve } from "@hono/node-server";
import { app } from "./server.js";

const port = Number(process.env.PORT ?? 4000);

serve({ fetch: app.fetch, port }, (info) => {
  console.log(`@darna/backend listening on http://localhost:${info.port}`);
  console.log(`  health → http://localhost:${info.port}/health`);
  console.log(`  rpc    → http://localhost:${info.port}/rpc/<router>/<procedure>`);
});
