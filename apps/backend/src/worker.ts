import * as Cloudflare from "alchemy/Cloudflare";
import * as Drizzle from "alchemy/Drizzle";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { HttpApiBuilder, HttpApiScalar } from "effect/unstable/httpapi";
import { HttpRouter, HttpServer } from "effect/unstable/http";
import { Api } from "./api.ts";
import { GreetingsHandlers } from "./greetings/greetings.handlers.ts";
import { UsersHandlers } from "./users/users.handlers.ts";
import { Database } from "./db/database.ts";
import { Hyperdrive } from "./db/Db.ts";

// The API as a router layer: endpoints + handlers + OpenAPI spec + Scalar docs.
const ApiLive = Layer.mergeAll(
  HttpApiBuilder.layer(Api, { openapiPath: "/openapi.json" }),
  HttpApiScalar.layer(Api, { path: "/docs" }),
).pipe(Layer.provide(GreetingsHandlers), Layer.provide(UsersHandlers));

/**
 * Effect-native Cloudflare Worker. Init binds Hyperdrive and builds the
 * Effect-Drizzle `db` once per isolate; `fetch` serves the HttpApi.
 */
export default class Worker extends Cloudflare.Worker<Worker>()(
  "Api",
  { main: import.meta.filename, url: true },
  Effect.gen(function* () {
    const conn = yield* Cloudflare.Hyperdrive.bind(Hyperdrive);
    const db = yield* Drizzle.postgres(conn.connectionString);
    const fetch = yield* HttpRouter.toHttpEffect(
      ApiLive.pipe(Layer.provide(Layer.succeed(Database, db))),
    );
    return { fetch };
  }).pipe(
    Effect.provide(
      Layer.mergeAll(Cloudflare.HyperdriveBindingLive, HttpServer.layerServices),
    ),
  ),
) {}
