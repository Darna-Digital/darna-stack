import { app } from "./server.js";
import { setRuntimeEnv } from "./lib/db/client.js";

export interface Env {
  HYPERDRIVE: Hyperdrive;
}

export default {
  fetch(request: Request, env: Env, ctx: ExecutionContext) {
    setRuntimeEnv(env);
    return app.fetch(request, env, ctx);
  },
} satisfies ExportedHandler<Env>;
