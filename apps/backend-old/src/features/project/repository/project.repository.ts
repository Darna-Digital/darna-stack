import { Context, Effect } from "effect";
import type { CreateProject, Project, ProjectId, UpdateProject } from "../schema/project.model.js";

export interface ProjectRepo {
  readonly list: () => Effect.Effect<readonly Project[]>;
  readonly findById: (id: ProjectId) => Effect.Effect<Project | undefined>;
  readonly create: (input: CreateProject) => Effect.Effect<Project>;
  readonly update: (id: ProjectId, patch: UpdateProject) => Effect.Effect<Project | undefined>;
  readonly remove: (id: ProjectId) => Effect.Effect<boolean>;
}

export class ProjectRepository extends Context.Tag("ProjectRepository")<
  ProjectRepository,
  ProjectRepo
>() {}
