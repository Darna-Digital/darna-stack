import { HttpApi } from "effect/unstable/httpapi";
import { GreetingsApi } from "./greetings/greetings.api.ts";

export class Api extends HttpApi.make("darna").add(GreetingsApi).prefix("/api") {}
