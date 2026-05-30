import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";
import * as Schema from "effect/Schema";
import { CreateUser, User } from "./users.model.ts";

/** Postgres-backed `users` API group (Drizzle + Hyperdrive + PlanetScale). */
export class UsersApi extends HttpApiGroup.make("users")
  .add(HttpApiEndpoint.get("list", "/users", { success: Schema.Array(User) }))
  .add(HttpApiEndpoint.post("create", "/users", { payload: CreateUser, success: User })) {}
