import { HttpApiBuilder } from "effect/unstable/httpapi";
import * as Effect from "effect/Effect";
import { Api } from "../api.ts";
import { Database } from "../db/database.ts";
import { Users } from "../db/schema.ts";

export const UsersHandlers = HttpApiBuilder.group(Api, "users", (handlers) =>
  Effect.gen(function* () {
    const db = yield* Database;
    return handlers
      .handle("list", () =>
        db
          .select({ id: Users.id, email: Users.email, name: Users.name })
          .from(Users)
          .pipe(Effect.orDie),
      )
      .handle("create", ({ payload }) =>
        db
          .insert(Users)
          .values({ email: payload.email, name: payload.name })
          .returning({ id: Users.id, email: Users.email, name: Users.name })
          .pipe(
            Effect.orDie,
            Effect.map((rows) => rows[0]!),
          ),
      );
  }),
);
