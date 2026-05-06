import { HttpApi } from "@effect/platform"
import { TodoApi } from "./features/todo/http/todo.api.js"
import { ProjectApi } from "./features/project/http/project.api.js"
import { AdminApi } from "./features/admin/admin.api.js"

export class Api extends HttpApi.make("darna")
  .add(TodoApi)
  .add(ProjectApi)
  .add(AdminApi)
  .prefix("/api") {}
