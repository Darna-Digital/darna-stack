import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "effect/unstable/httpapi";
import * as Schema from "effect/Schema";
import { StorageError } from "../../../layers/db/db.ts";
import { Authentication } from "../../auth/auth.middleware.ts";
import { TaskId, TaskNotFound, TaskSchema } from "../schema/task.schema.model.ts";
import { UpdateTaskSchema } from "../schema/task.schema.requests.ts";

const IdParam = Schema.Struct({ id: TaskId });

/**
 * Task-scoped actions (Adam Wathan's child-resource controller): every `:id` is
 * a *task's* own id. Listing/creating within a project lives in
 * {@link ProjectTasksApi}. Requires a session.
 */
export class TasksApi extends HttpApiGroup.make("tasks")
  .add(
    HttpApiEndpoint.get("show", "/tasks/:id", {
      params: IdParam,
      success: TaskSchema,
      error: [TaskNotFound, StorageError],
    }),
  )
  .add(
    HttpApiEndpoint.put("update", "/tasks/:id", {
      params: IdParam,
      payload: UpdateTaskSchema,
      success: TaskSchema,
      error: [TaskNotFound, StorageError],
    }),
  )
  .add(
    HttpApiEndpoint.delete("destroy", "/tasks/:id", {
      params: IdParam,
      success: HttpApiSchema.NoContent,
      error: [TaskNotFound, StorageError],
    }),
  )
  .middleware(Authentication) {}
