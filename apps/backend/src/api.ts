import { HttpApi } from "@effect/platform";
import { TodoApi } from "./features/todo/http/todo.api.js";
import { ProjectApi } from "./features/project/http/project.api.js";
import { FileApi } from "./features/file/http/file.api.js";
import { AdminApi } from "./features/admin/admin.api.js";

export class Api extends HttpApi.make("darna")
  .add(TodoApi)
  .add(ProjectApi)
  .add(FileApi)
  .add(AdminApi)
  .prefix("/api") {}
