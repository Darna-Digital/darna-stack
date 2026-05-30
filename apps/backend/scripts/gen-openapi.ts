import { OpenApi } from "effect/unstable/httpapi";
import { Api } from "../src/api.ts";

// Emit the OpenAPI spec for the HttpApi to stdout. Runs offline (no server /
// no DB) — the Api is just endpoint + schema definitions.
//   bun run scripts/gen-openapi.ts > openapi.json
process.stdout.write(JSON.stringify(OpenApi.fromApi(Api), null, 2));
