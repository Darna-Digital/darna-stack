import { HttpApi } from "@effect/platform"
import { TodoApi } from "./features/todo/http/todo.http.js"
import { AdminApi } from "./features/admin/admin.api.js"

export class Api extends HttpApi.make("darna")
  .add(TodoApi)
  .add(AdminApi)
  .prefix("/api") {}
