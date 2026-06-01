import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import { StorageError, type Patch } from "../../../layers/db/db.ts";
import { ProjectNotFound, type Project, type ProjectId } from "../schema/project.schema.model.ts";

export type ProjectFilter = { ownerId?: string | undefined };

export interface ProjectRepo {
  list: (filter?: ProjectFilter) => Effect.Effect<Project[], StorageError>;
  get: (id: ProjectId) => Effect.Effect<Project, ProjectNotFound | StorageError>;
  create: (project: Project) => Effect.Effect<Project, StorageError>;
  update: (
    id: ProjectId,
    patch: Patch<Project>,
  ) => Effect.Effect<Project, ProjectNotFound | StorageError>;
  remove: (id: ProjectId) => Effect.Effect<void, ProjectNotFound | StorageError>;
}

export class ProjectRepository extends Context.Service<ProjectRepository, ProjectRepo>()(
  "ProjectRepository",
) {}
