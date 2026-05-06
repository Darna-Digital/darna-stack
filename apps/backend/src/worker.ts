import { app } from "./server.js";

// Cloudflare Workers entrypoint — Hono is fetch-native, so we just export the app.
// Local Node dev still uses src/index.ts (@hono/node-server). They share src/server.ts.
export default app;
