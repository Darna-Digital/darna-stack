import { Layer } from "effect";
import { ProjectRepository } from "../repository/project.repository.js";
import { createDbProjectRepo } from "../repository/project.repository.db.js";
import { createMemoryProjectRepo } from "../repository/project.repository.memory.js";
import { Projects } from "../service/project.service.js";
import type { Project } from "../schema/project.model.js";

export const ProjectsMemory = (seed: readonly Project[] = []) =>
  Projects.Default.pipe(
    Layer.provide(Layer.effect(ProjectRepository, createMemoryProjectRepo(seed))),
  );

export const ProjectsLive = Projects.Default.pipe(
  Layer.provide(Layer.succeed(ProjectRepository, createDbProjectRepo)),
);
