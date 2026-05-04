import { todoRouter } from "./features/todo/todo.router.js"
import { adminRouter } from "./features/admin/admin.router.js"

export const router = {
  todo: todoRouter,
  admin: adminRouter,
}

export type AppRouter = typeof router
