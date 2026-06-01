import * as Schema from "effect/Schema";
import { ProjectName } from "./project.schema.model.ts";

export const CreateProjectSchema = Schema.Struct({
  name: ProjectName,
});
export type CreateProject = typeof CreateProjectSchema.Type;

export const UpdateProjectSchema = Schema.Struct({
  name: Schema.optionalKey(ProjectName),
});
export type UpdateProject = typeof UpdateProjectSchema.Type;
