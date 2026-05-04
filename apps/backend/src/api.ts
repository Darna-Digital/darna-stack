import { HttpApi } from "@effect/platform"
import { TodoApi } from "./features/todo/todo.api.js"
import { AdminApi } from "./features/admin/admin.api.js"

export class Api extends HttpApi.make("darna").add(TodoApi).add(AdminApi) {}
