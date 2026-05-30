import { app } from "./server.ts";

// Cloudflare Worker entry — Hono's app is a valid `{ fetch }` handler.
export default app;
