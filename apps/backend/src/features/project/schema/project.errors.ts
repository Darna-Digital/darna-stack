import { HttpApiSchema } from "@effect/platform";
import { Schema } from "effect";
import { ProjectId } from "./project.model.js";

export class ProjectNotFound extends Schema.TaggedError<ProjectNotFound>()(
  "ProjectNotFound",
  { id: ProjectId },
  HttpApiSchema.annotations({ status: 404 }),
) {}
