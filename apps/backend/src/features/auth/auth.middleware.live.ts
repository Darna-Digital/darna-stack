import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Redacted from "effect/Redacted";
import { authInstance } from "./better-auth.ts";
import { CurrentUser, type User } from "./current-user.ts";
import { Authentication, NotAuthenticated } from "./auth.middleware.ts";

// Reads the better-auth instance synchronously (no service requirement) so the
// middleware handler's effect only depends on the route context.
const resolveUser = (credential: Redacted.Redacted<string>) =>
  Effect.tryPromise({
    try: () =>
      authInstance().api.getSession({
        headers: new Headers({
          cookie: `better-auth.session_token=${Redacted.value(credential)}`,
        }),
      }),
    catch: () => new NotAuthenticated(),
  }).pipe(
    Effect.flatMap((session) =>
      session?.user
        ? Effect.succeed({
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            emailVerified: session.user.emailVerified,
            image: session.user.image ?? null,
          } satisfies User)
        : Effect.fail(new NotAuthenticated()),
    ),
    Effect.withSpan("Auth.getSession", { attributes: { "auth.provider": "better-auth" } }),
  );

export const AuthenticationLive = Layer.succeed(Authentication, {
  cookie: (httpEffect, { credential }) =>
    resolveUser(credential).pipe(
      Effect.flatMap((user) => Effect.provideService(httpEffect, CurrentUser, user)),
    ),
});
