import * as Layer from "effect/Layer";
import { ProjectRepository } from "../repository/project.repository.ts";
import { makeDbProjectRepository } from "../repository/project.repository.db.ts";
import { Projects } from "../service/project.service.ts";

/** Production wiring: Projects service over the Postgres repository. Requires
 * the `RawSql` service (provided by the Worker). */
export const ProjectsLive = Layer.effect(Projects, Projects.make).pipe(
  Layer.provide(Layer.effect(ProjectRepository, makeDbProjectRepository)),
);
