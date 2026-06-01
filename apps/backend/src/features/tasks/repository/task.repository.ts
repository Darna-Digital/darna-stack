import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import { StorageError, type Patch } from "../../../layers/db/db.ts";
import { TaskNotFound, type Task, type TaskId } from "../schema/task.schema.model.ts";

export type TaskFilter = { projectId?: string | undefined };

export interface TaskRepo {
  list: (filter?: TaskFilter) => Effect.Effect<Task[], StorageError>;
  get: (id: TaskId) => Effect.Effect<Task, TaskNotFound | StorageError>;
  create: (task: Task) => Effect.Effect<Task, StorageError>;
  update: (id: TaskId, patch: Patch<Task>) => Effect.Effect<Task, TaskNotFound | StorageError>;
  remove: (id: TaskId) => Effect.Effect<void, TaskNotFound | StorageError>;
}

export class TaskRepository extends Context.Service<TaskRepository, TaskRepo>()(
  "TaskRepository",
) {}
