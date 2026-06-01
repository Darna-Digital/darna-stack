import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import { CurrentUser } from "../../auth/current-user.ts";
import { ProjectRepository } from "../repository/project.repository.ts";
import { ProjectNotFound, type Project, type ProjectId } from "../schema/project.schema.model.ts";
import type { CreateProject, UpdateProject } from "../schema/project.schema.requests.ts";

const make = Effect.gen(function* () {
  const repo = yield* ProjectRepository;

  const getOwned = (id: ProjectId) =>
    Effect.gen(function* () {
      const user = yield* CurrentUser;
      const project = yield* repo.get(id);
      return yield* project.ownerId === user.id
        ? Effect.succeed(project)
        : Effect.fail(new ProjectNotFound({ id }));
    });

  return {
    mine: () =>
      Effect.gen(function* () {
        const user = yield* CurrentUser;
        return yield* repo.list({ ownerId: user.id });
      }).pipe(Effect.withSpan("Projects.mine")),

    getById: (id: ProjectId) =>
      getOwned(id).pipe(Effect.withSpan("Projects.getById", { attributes: { "project.id": id } })),

    create: (input: CreateProject) =>
      Effect.gen(function* () {
        const user = yield* CurrentUser;
        const project: Project = {
          id: crypto.randomUUID() as ProjectId,
          name: input.name,
          ownerId: user.id,
          createdAt: new Date().toISOString(),
        };
        yield* Effect.logInfo("Creating project").pipe(
          Effect.annotateLogs({ "user.id": user.id, "project.name": input.name }),
        );
        return yield* repo.create(project);
      }).pipe(Effect.withSpan("Projects.create", { attributes: { "project.name": input.name } })),

    update: (id: ProjectId, input: UpdateProject) =>
      getOwned(id).pipe(
        Effect.flatMap(() => repo.update(id, input)),
        Effect.withSpan("Projects.update", { attributes: { "project.id": id } }),
      ),

    remove: (id: ProjectId) =>
      getOwned(id).pipe(
        Effect.flatMap(() => repo.remove(id)),
        Effect.withSpan("Projects.remove", { attributes: { "project.id": id } }),
      ),
  };
});

export class Projects extends Context.Service<Projects, Effect.Success<typeof make>>()("Projects", {
  make,
}) {}
