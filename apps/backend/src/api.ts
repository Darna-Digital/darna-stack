import { HttpApi } from "effect/unstable/httpapi";
import { GreetingsApi } from "./greetings/greetings.api.ts";
import { WorkflowsApi } from "./workflows/workflows.api.ts";
import { TodoApi } from "./todos/http/todo.api.ts";

export class Api extends HttpApi.make("darna")
  .add(GreetingsApi)
  .add(WorkflowsApi)
  .add(TodoApi)
  .prefix("/api") {}
