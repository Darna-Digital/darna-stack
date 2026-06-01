import { HttpApiMiddleware, HttpApiSecurity } from "effect/unstable/httpapi";
import * as Schema from "effect/Schema";
import { CurrentUser } from "./current-user.ts";

export class NotAuthenticated extends Schema.TaggedErrorClass<NotAuthenticated>()(
  "NotAuthenticated",
  {},
  { httpApiStatus: 401 },
) {}

/**
 * Cookie-based auth guard. Extracts the better-auth session cookie and, on
 * success, provides {@link CurrentUser} to the endpoint. Apply to a group with
 * `.middleware(Authentication)`.
 */
export class Authentication extends HttpApiMiddleware.Service<
  Authentication,
  { provides: CurrentUser }
>()("Authentication", {
  error: NotAuthenticated,
  security: {
    cookie: HttpApiSecurity.apiKey({
      in: "cookie",
      key: "better-auth.session_token",
    }),
  },
}) {}
