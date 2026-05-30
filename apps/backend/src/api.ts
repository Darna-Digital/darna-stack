import { HttpApi } from "effect/unstable/httpapi";
import { GreetingsApi } from "./greetings/greetings.api.ts";

/** The full HTTP API, served under `/api`. */
export class Api extends HttpApi.make("darna").add(GreetingsApi).prefix("/api") {}
