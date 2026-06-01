import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import type { User } from "../../../auth/current-user.ts";
import type { Task } from "../../schema/task.schema.model.ts";

export interface TaskNotifierService {
  readonly taskCreated: (task: Task, owner: User) => Effect.Effect<void>;
}

export class TaskNotifier extends Context.Service<TaskNotifier, TaskNotifierService>()(
  "TaskNotifier",
) {}
