import { Effect } from "effect";
import { ProjectRepository } from "../repository/project.repository.js";
import { ProjectNotFound } from "../schema/project.errors.js";
import type { CreateProject, Project, ProjectId, UpdateProject } from "../schema/project.model.js";

export class Projects extends Effect.Service<Projects>()("Projects", {
  accessors: true,
  effect: Effect.gen(function* () {
    const repo = yield* ProjectRepository;

    const list = (): Effect.Effect<readonly Project[]> =>
      repo.list().pipe(Effect.withSpan("Projects.list"));

    const getById = (id: ProjectId): Effect.Effect<Project, ProjectNotFound> =>
      Effect.gen(function* () {
        const project = yield* repo.findById(id);
        if (!project) return yield* Effect.fail(new ProjectNotFound({ id }));
        return project;
      }).pipe(
        Effect.withSpan("Projects.getById", {
          attributes: { "project.id": id },
        }),
      );

    const create = (input: CreateProject): Effect.Effect<Project> =>
      repo.create(input).pipe(Effect.withSpan("Projects.create"));

    const update = (id: ProjectId, patch: UpdateProject): Effect.Effect<Project, ProjectNotFound> =>
      Effect.gen(function* () {
        const project = yield* repo.update(id, patch);
        if (!project) return yield* Effect.fail(new ProjectNotFound({ id }));
        return project;
      }).pipe(
        Effect.withSpan("Projects.update", {
          attributes: { "project.id": id },
        }),
      );

    const remove = (id: ProjectId): Effect.Effect<void, ProjectNotFound> =>
      Effect.gen(function* () {
        const removed = yield* repo.remove(id);
        if (!removed) return yield* Effect.fail(new ProjectNotFound({ id }));
      }).pipe(
        Effect.withSpan("Projects.remove", {
          attributes: { "project.id": id },
        }),
      );

    return { list, getById, create, update, remove } as const;
  }),
}) {}
