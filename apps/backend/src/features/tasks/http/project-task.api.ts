import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "effect/unstable/httpapi";
import * as Schema from "effect/Schema";
import { StorageError } from "../../../layers/db/db.ts";
import { Authentication } from "../../auth/auth.middleware.ts";
import { ProjectId, ProjectNotFound } from "../../projects/schema/project.schema.model.ts";
import { TaskSchema } from "../schema/task.schema.model.ts";
import { CreateTaskSchema } from "../schema/task.schema.requests.ts";

const ProjectParam = Schema.Struct({ projectId: ProjectId });

export class ProjectTasksApi extends HttpApiGroup.make("projectTasks")
  .add(
    HttpApiEndpoint.get("index", "/projects/:projectId/tasks", {
      params: ProjectParam,
      success: Schema.Array(TaskSchema),
      error: [ProjectNotFound, StorageError],
    }),
  )
  .add(
    HttpApiEndpoint.post("store", "/projects/:projectId/tasks", {
      params: ProjectParam,
      payload: CreateTaskSchema,
      success: TaskSchema.pipe(HttpApiSchema.status(201)),
      error: [ProjectNotFound, StorageError],
    }),
  )
  .middleware(Authentication) {}
