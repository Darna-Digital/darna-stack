import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";
import * as Schema from "effect/Schema";
import { CreateGreeting, Greeting } from "./greetings.model.ts";

/** The `greetings` API group: list and create. */
export class GreetingsApi extends HttpApiGroup.make("greetings")
  .add(HttpApiEndpoint.get("list", "/greetings", { success: Schema.Array(Greeting) }))
  .add(
    HttpApiEndpoint.post("create", "/greetings", {
      payload: CreateGreeting,
      success: Greeting,
    }),
  ) {}
