import { HttpApiBuilder } from "@effect/platform";
import { Effect, Layer, Redacted } from "effect";
import { Api } from "../../api.js";
import { verifyWorkOSAccessToken } from "../../lib/auth/workos.js";
import { Authentication, CurrentUser, Unauthorized } from "./admin.auth.js";

const AuthenticationLive = Layer.effect(
  Authentication,
  Effect.succeed(
    Authentication.of({
      bearer: (token) =>
        Effect.tryPromise({
          try: () => verifyWorkOSAccessToken(Redacted.value(token)),
          catch: () => new Unauthorized({ reason: "Invalid or expired token" }),
        }),
    }),
  ),
);

const AdminHandlersLive = HttpApiBuilder.group(Api, "admin", (handlers) =>
  handlers.handle("me", () =>
    Effect.gen(function* () {
      const user = yield* CurrentUser;
      return {
        sub: user.sub,
        org_id: user.org_id,
        role: user.role,
        permissions: user.permissions ? [...user.permissions] : undefined,
      };
    }),
  ),
);

export const AdminHandlers = AdminHandlersLive.pipe(Layer.provide(AuthenticationLive));
