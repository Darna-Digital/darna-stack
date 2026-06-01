import { HttpApi } from "effect/unstable/httpapi";
import { GreetingsApi } from "./features/greetings/greetings.api.ts";
import { WorkflowsApi } from "./features/workflows/workflows.api.ts";
import { TodoApi } from "./features/todos/http/todo.api.ts";

export class Api extends HttpApi.make("darna")
  .add(GreetingsApi)
  .add(WorkflowsApi)
  .add(TodoApi)
  .prefix("/api") {}
