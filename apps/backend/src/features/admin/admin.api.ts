import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform";
import { Schema } from "effect";
import { Authentication } from "./admin.auth.js";

export const Me = Schema.Struct({
  sub: Schema.String,
  org_id: Schema.optional(Schema.String),
  role: Schema.optional(Schema.String),
  permissions: Schema.optional(Schema.Array(Schema.String)),
});

export class AdminApi extends HttpApiGroup.make("admin")
  .add(HttpApiEndpoint.get("me", "/admin/me").addSuccess(Me))
  .middleware(Authentication) {}
