import { base } from "../../lib/effect/orpc.js"
import { verifyWorkOSAccessToken } from "../../lib/auth/workos.js"

export const authed = base.use(async ({ context, next, errors }) => {
  const header = context.request.headers.get("authorization")
  if (!header || !header.toLowerCase().startsWith("bearer ")) {
    throw errors.UNAUTHORIZED({ data: { reason: "Missing Bearer token" } })
  }
  const token = header.slice(7).trim()
  if (!token) {
    throw errors.UNAUTHORIZED({ data: { reason: "Empty Bearer token" } })
  }
  try {
    const user = await verifyWorkOSAccessToken(token)
    return next({ context: { user } })
  } catch {
    throw errors.UNAUTHORIZED({ data: { reason: "Invalid or expired token" } })
  }
})
