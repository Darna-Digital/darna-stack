import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import { CurrentUser } from "../../auth/current-user.ts";
import { ProjectRepository } from "../../projects/repository/project.repository.ts";
import {
  ProjectNotFound,
  type ProjectId,
} from "../../projects/schema/project.schema.model.ts";
import { TaskRepository } from "../repository/task.repository.ts";
import { TaskNotFound, type Task, type TaskId } from "../schema/task.schema.model.ts";
import type { CreateTask, UpdateTask } from "../schema/task.schema.requests.ts";

const make = Effect.gen(function* () {
  const tasks = yield* TaskRepository;
  const projects = yield* ProjectRepository;

  /** A task's access is its project's access. Loads the project and fails
   * `ProjectNotFound` unless it belongs to the current user. */
  const ensureProjectOwned = (projectId: ProjectId) =>
    Effect.gen(function* () {
      const user = yield* CurrentUser;
      const project = yield* projects.get(projectId);
      return yield* project.ownerId === user.id
        ? Effect.succeed(project)
        : Effect.fail(new ProjectNotFound({ id: projectId }));
    });

  /** Load a task the current user may act on, or `TaskNotFound`. The project
   * miss is mapped to `TaskNotFound` so the task resource never leaks project
   * existence. */
  const ownedTask = (id: TaskId) =>
    Effect.gen(function* () {
      const user = yield* CurrentUser;
      const task = yield* tasks.get(id);
      const project = yield* projects
        .get(task.projectId as ProjectId)
        .pipe(Effect.catchTag("ProjectNotFound", () => Effect.fail(new TaskNotFound({ id }))));
      return yield* project.ownerId === user.id
        ? Effect.succeed(task)
        : Effect.fail(new TaskNotFound({ id }));
    });

  return {
    /** Tasks of a project the current user owns. */
    listForProject: (projectId: ProjectId) =>
      ensureProjectOwned(projectId).pipe(
        Effect.flatMap(() => tasks.list({ projectId })),
        Effect.withSpan("Tasks.listForProject", { attributes: { "project.id": projectId } }),
      ),

    create: (projectId: ProjectId, input: CreateTask) =>
      ensureProjectOwned(projectId).pipe(
        Effect.flatMap(() => {
          const task: Task = {
            id: crypto.randomUUID() as TaskId,
            title: input.title,
            done: false,
            projectId,
            createdAt: new Date().toISOString(),
          };
          return Effect.logInfo("Creating task")
            .pipe(Effect.annotateLogs({ "project.id": projectId, "task.title": input.title }))
            .pipe(Effect.flatMap(() => tasks.create(task)));
        }),
        Effect.withSpan("Tasks.create", { attributes: { "project.id": projectId } }),
      ),

    getById: (id: TaskId) =>
      ownedTask(id).pipe(Effect.withSpan("Tasks.getById", { attributes: { "task.id": id } })),

    update: (id: TaskId, input: UpdateTask) =>
      ownedTask(id).pipe(
        Effect.flatMap(() => tasks.update(id, input)),
        Effect.withSpan("Tasks.update", { attributes: { "task.id": id } }),
      ),

    remove: (id: TaskId) =>
      ownedTask(id).pipe(
        Effect.flatMap(() => tasks.remove(id)),
        Effect.withSpan("Tasks.remove", { attributes: { "task.id": id } }),
      ),
  };
});

export class Tasks extends Context.Service<Tasks, Effect.Success<typeof make>>()("Tasks", {
  make,
}) {}
