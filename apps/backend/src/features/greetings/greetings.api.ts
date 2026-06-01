import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";
import * as Schema from "effect/Schema";
import { CreateGreeting, Greeting } from "./greetings.model.ts";

export class GreetingsApi extends HttpApiGroup.make("greetings")
  .add(HttpApiEndpoint.get("index", "/greetings", { success: Schema.Array(Greeting) }))
  .add(
    HttpApiEndpoint.post("store", "/greetings", {
      payload: CreateGreeting,
      success: Greeting,
    }),
  ) {}
