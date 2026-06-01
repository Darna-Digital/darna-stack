import * as Layer from "effect/Layer";
import { ProjectRepository } from "../repository/project.repository.ts";
import { makeDbProjectRepository } from "../repository/project.repository.db.ts";
import { Projects } from "../service/project.service.ts";

export const ProjectsLive = Layer.effect(Projects, Projects.make).pipe(
  Layer.provide(Layer.effect(ProjectRepository, makeDbProjectRepository)),
);
