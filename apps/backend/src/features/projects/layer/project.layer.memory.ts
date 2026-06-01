import * as Layer from "effect/Layer";
import type { Project } from "../schema/project.schema.model.ts";
import { ProjectRepository } from "../repository/project.repository.ts";
import { makeMemoryProjectRepository } from "../repository/project.repository.memory.ts";
import { Projects } from "../service/project.service.ts";

export const ProjectsMemory = ({ seed = [] }: { seed?: readonly Project[] } = {}) =>
  Layer.effect(Projects, Projects.make).pipe(
    Layer.provide(Layer.effect(ProjectRepository, makeMemoryProjectRepository(seed))),
  );
