import { OpenApi } from "effect/unstable/httpapi";
import { Api } from "../src/api.ts";

process.stdout.write(JSON.stringify(OpenApi.fromApi(Api), null, 2));
