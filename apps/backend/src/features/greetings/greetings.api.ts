import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";
import * as Schema from "effect/Schema";
import { CreateGreeting, Greeting } from "./greetings.model.ts";

/** The `greetings` API group: standard CRUD actions only (index, store). */
export class GreetingsApi extends HttpApiGroup.make("greetings")
  .add(HttpApiEndpoint.get("index", "/greetings", { success: Schema.Array(Greeting) }))
  .add(
    HttpApiEndpoint.post("store", "/greetings", {
      payload: CreateGreeting,
      success: Greeting,
    }),
  ) {}
