import { Hono } from "hono"
import { describeRoute, resolver } from "hono-openapi"
import { z } from "zod"
import { adminMiddleware } from "@/middleware/admin.js"

const Me = z.object({
  sub: z.string(),
  org_id: z.string().optional(),
  role: z.string().optional(),
  permissions: z.array(z.string()).optional(),
})

export const adminRoutes = new Hono()
  .use("*", adminMiddleware)
  .get(
    "/me",
    describeRoute({
      operationId: "admin.me",
      summary: "Return the verified WorkOS user for the current Bearer token",
      responses: {
        200: {
          description: "OK",
          content: { "application/json": { schema: resolver(Me) } },
        },
        401: { description: "Unauthorized" },
      },
    }),
    (c) => {
      const user = c.get("user")
      return c.json({
        sub: user.sub,
        org_id: user.org_id,
        role: user.role,
        permissions: user.permissions,
      })
    },
  )
