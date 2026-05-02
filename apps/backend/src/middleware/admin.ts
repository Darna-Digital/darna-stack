import { createMiddleware } from "hono/factory"
import { HTTPException } from "hono/http-exception"
import {
  verifyWorkOSAccessToken,
  type WorkOSAccessTokenPayload,
} from "@/lib/auth/workos.js"

declare module "hono" {
  interface ContextVariableMap {
    user: WorkOSAccessTokenPayload
  }
}

/**
 * Apply to any route or sub-app to require a valid WorkOS access token.
 *
 *   app.use("/admin/*", adminMiddleware)
 *   // or per-route:
 *   app.get("/foo", adminMiddleware, (c) => c.json(c.get("user")))
 *
 * Reads `Authorization: Bearer <token>`, verifies against the WorkOS JWKS
 * for `WORKOS_CLIENT_ID`, and stashes the decoded payload on the Hono
 * context as `user` (typed via `ContextVariableMap`).
 *
 * TODO: also surface the verified user as an Effect `CurrentUser` Context.Tag
 * so service code can `yield* CurrentUser` instead of reaching into Hono.
 */
export const adminMiddleware = createMiddleware(async (c, next) => {
  const header = c.req.header("authorization")
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    throw new HTTPException(401, { message: "Missing Bearer token" })
  }
  const token = header.slice(7).trim()
  if (!token) {
    throw new HTTPException(401, { message: "Empty Bearer token" })
  }

  try {
    const user = await verifyWorkOSAccessToken(token)
    c.set("user", user)
  } catch {
    throw new HTTPException(401, { message: "Invalid or expired token" })
  }

  await next()
})
