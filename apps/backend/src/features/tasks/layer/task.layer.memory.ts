import * as Layer from "effect/Layer";
import type { Project } from "../../projects/schema/project.schema.model.ts";
import { ProjectRepository } from "../../projects/repository/project.repository.ts";
import { makeMemoryProjectRepository } from "../../projects/repository/project.repository.memory.ts";
import type { Task } from "../schema/task.schema.model.ts";
import { TaskRepository } from "../repository/task.repository.ts";
import { makeMemoryTaskRepository } from "../repository/task.repository.memory.ts";
import { Tasks } from "../service/task.service.ts";

/** Test wiring: Tasks service over in-memory task + project repositories. Seed
 * both so the ownership-through-project rule is exercisable. No DB required. */
export const TasksMemory = ({
  projects = [],
  tasks = [],
}: { projects?: readonly Project[]; tasks?: readonly Task[] } = {}) =>
  Layer.effect(Tasks, Tasks.make).pipe(
    Layer.provide(Layer.effect(TaskRepository, makeMemoryTaskRepository(tasks))),
    Layer.provide(Layer.effect(ProjectRepository, makeMemoryProjectRepository(projects))),
  );
