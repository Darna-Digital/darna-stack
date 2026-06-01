import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "effect/unstable/httpapi";
import * as Schema from "effect/Schema";
import { StorageError } from "../../../layers/db/db.ts";
import { Authentication } from "../../auth/auth.middleware.ts";
import { ProjectId, ProjectNotFound, ProjectSchema } from "../schema/project.schema.model.ts";
import { CreateProjectSchema, UpdateProjectSchema } from "../schema/project.schema.requests.ts";

const IdParam = Schema.Struct({ id: ProjectId });

/** CRUD for the current user's projects. Every endpoint requires a session. */
export class ProjectsApi extends HttpApiGroup.make("projects")
  .add(
    HttpApiEndpoint.get("index", "/projects", {
      success: Schema.Array(ProjectSchema),
      error: StorageError,
    }),
  )
  .add(
    HttpApiEndpoint.post("store", "/projects", {
      payload: CreateProjectSchema,
      success: ProjectSchema.pipe(HttpApiSchema.status(201)),
      error: StorageError,
    }),
  )
  .add(
    HttpApiEndpoint.get("show", "/projects/:id", {
      params: IdParam,
      success: ProjectSchema,
      error: [ProjectNotFound, StorageError],
    }),
  )
  .add(
    HttpApiEndpoint.put("update", "/projects/:id", {
      params: IdParam,
      payload: UpdateProjectSchema,
      success: ProjectSchema,
      error: [ProjectNotFound, StorageError],
    }),
  )
  .add(
    HttpApiEndpoint.delete("destroy", "/projects/:id", {
      params: IdParam,
      success: HttpApiSchema.NoContent,
      error: [ProjectNotFound, StorageError],
    }),
  )
  .middleware(Authentication) {}
