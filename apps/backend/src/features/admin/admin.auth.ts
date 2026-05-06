import { HttpApiMiddleware, HttpApiSchema, HttpApiSecurity } from "@effect/platform";
import { Context, Schema } from "effect";
import type { WorkOSAccessTokenPayload } from "../../lib/auth/workos.js";

export class CurrentUser extends Context.Tag("CurrentUser")<
  CurrentUser,
  WorkOSAccessTokenPayload
>() {}

export class Unauthorized extends Schema.TaggedError<Unauthorized>()(
  "Unauthorized",
  { reason: Schema.String },
  HttpApiSchema.annotations({ status: 401 }),
) {}

export class Authentication extends HttpApiMiddleware.Tag<Authentication>()("Authentication", {
  failure: Unauthorized,
  provides: CurrentUser,
  security: { bearer: HttpApiSecurity.bearer },
}) {}
