import { z } from "zod"
import { authed } from "./admin.middleware.js"

const Me = z.object({
  sub: z.string(),
  org_id: z.string().optional(),
  role: z.string().optional(),
  permissions: z.array(z.string()).optional(),
})

export const adminRouter = {
  me: authed
    .route({ method: "GET", path: "/admin/me" })
    .output(Me)
    .handler(({ context }) => ({
      sub: context.user.sub,
      org_id: context.user.org_id,
      role: context.user.role,
      permissions: context.user.permissions
        ? [...context.user.permissions]
        : undefined,
    })),
}
