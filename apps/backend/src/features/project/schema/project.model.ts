import { Schema } from "effect";

export const ProjectId = Schema.UUID.pipe(Schema.brand("ProjectId"));
export type ProjectId = typeof ProjectId.Type;

export const Project = Schema.Struct({
  id: ProjectId,
  name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(200)),
  createdAt: Schema.String,
});
export type Project = typeof Project.Type;

export const CreateProject = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(200)),
});
export type CreateProject = typeof CreateProject.Type;

export const UpdateProject = Schema.Struct({
  name: Schema.optional(Schema.String.pipe(Schema.minLength(1), Schema.maxLength(200))),
});
export type UpdateProject = typeof UpdateProject.Type;
