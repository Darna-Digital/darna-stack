import * as Schema from "effect/Schema";

export const ProjectId = Schema.String.pipe(Schema.brand("ProjectId"));
export type ProjectId = typeof ProjectId.Type;

export const ProjectName = Schema.Trim.pipe(Schema.check(Schema.isMinLength(1)));

export const ProjectSchema = Schema.Struct({
  id: ProjectId,
  name: ProjectName,
  ownerId: Schema.String,
  createdAt: Schema.String,
});
export type Project = typeof ProjectSchema.Type;

export class ProjectNotFound extends Schema.TaggedErrorClass<ProjectNotFound>()(
  "ProjectNotFound",
  { id: ProjectId },
  { httpApiStatus: 404 },
) {}
