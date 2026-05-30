import { HttpApi } from "effect/unstable/httpapi";
import { GreetingsApi } from "./greetings/greetings.api.ts";
import { UsersApi } from "./users/users.api.ts";

export class Api extends HttpApi.make("darna").add(GreetingsApi).add(UsersApi).prefix("/api") {}
