import * as Layer from "effect/Layer";
import { ProjectRepository } from "../../projects/repository/project.repository.ts";
import { makeDbProjectRepository } from "../../projects/repository/project.repository.db.ts";
import { TaskRepository } from "../repository/task.repository.ts";
import { makeDbTaskRepository } from "../repository/task.repository.db.ts";
import { Tasks } from "../service/task.service.ts";

/** Production wiring: Tasks service over the Postgres task + project
 * repositories (it authorizes through the owning project). Requires the
 * `RawSql` service (provided by the Worker). */
export const TasksLive = Layer.effect(Tasks, Tasks.make).pipe(
  Layer.provide(Layer.effect(TaskRepository, makeDbTaskRepository)),
  Layer.provide(Layer.effect(ProjectRepository, makeDbProjectRepository)),
);
