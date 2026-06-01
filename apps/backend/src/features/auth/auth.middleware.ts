import { HttpApiMiddleware, HttpApiSecurity } from "effect/unstable/httpapi";
import * as Schema from "effect/Schema";
import { CurrentUser } from "./current-user.ts";

export class NotAuthenticated extends Schema.TaggedErrorClass<NotAuthenticated>()(
  "NotAuthenticated",
  {},
  { httpApiStatus: 401 },
) {}

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
