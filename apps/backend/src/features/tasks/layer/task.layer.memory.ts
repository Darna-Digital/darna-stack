import * as Layer from "effect/Layer";
import type { Project } from "../../projects/schema/project.schema.model.ts";
import { ProjectRepository } from "../../projects/repository/project.repository.ts";
import { makeMemoryProjectRepository } from "../../projects/repository/project.repository.memory.ts";
import { TaskNotifier, TaskNotifierMemory } from "../workflow/task-notification.workflow.ts";
import type { Task } from "../schema/task.schema.model.ts";
import { TaskRepository } from "../repository/task.repository.ts";
import { makeMemoryTaskRepository } from "../repository/task.repository.memory.ts";
import { Tasks } from "../service/task.service.ts";

export const TasksMemory = ({
  projects = [],
  tasks = [],
  notifier = TaskNotifierMemory,
}: {
  projects?: readonly Project[];
  tasks?: readonly Task[];
  notifier?: Layer.Layer<TaskNotifier>;
} = {}) =>
  Layer.effect(Tasks, Tasks.make).pipe(
    Layer.provide(Layer.effect(TaskRepository, makeMemoryTaskRepository(tasks))),
    Layer.provide(Layer.effect(ProjectRepository, makeMemoryProjectRepository(projects))),
    Layer.provide(notifier),
  );
