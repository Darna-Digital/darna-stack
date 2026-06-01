import { HttpApi } from "effect/unstable/httpapi";
import { GreetingsApi } from "./features/greetings/greetings.api.ts";
import { GreetingRunsApi } from "./features/workflows/workflows.api.ts";
import { ProjectsApi } from "./features/projects/http/project.api.ts";
import { ProjectTasksApi } from "./features/tasks/http/project-task.api.ts";
import { TasksApi } from "./features/tasks/http/task.api.ts";

export class Api extends HttpApi.make("darna")
  .add(GreetingsApi)
  .add(GreetingRunsApi)
  .add(ProjectsApi)
  .add(ProjectTasksApi)
  .add(TasksApi)
  .prefix("/api") {}
