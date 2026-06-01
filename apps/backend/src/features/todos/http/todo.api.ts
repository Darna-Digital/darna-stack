import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "effect/unstable/httpapi";
import * as Schema from "effect/Schema";
import { StorageError } from "../../../layers/db/db.ts";
import { Authentication } from "../../auth/auth.middleware.ts";
import { TodoId, TodoNotFound, TodoSchema } from "../schema/todo.schema.model.ts";
import { CreateTodoSchema, UpdateTodoSchema } from "../schema/todo.schema.requests.ts";

const IdParam = Schema.Struct({ id: TodoId });

/** CRUD for the current user's todos. Every endpoint requires a session. */
export class TodoApi extends HttpApiGroup.make("todos")
  .add(
    HttpApiEndpoint.get("list", "/todos", {
      success: Schema.Array(TodoSchema),
      error: StorageError,
    }),
  )
  .add(
    HttpApiEndpoint.post("create", "/todos", {
      payload: CreateTodoSchema,
      success: TodoSchema.pipe(HttpApiSchema.status(201)),
      error: StorageError,
    }),
  )
  .add(
    HttpApiEndpoint.get("getById", "/todos/:id", {
      params: IdParam,
      success: TodoSchema,
      error: [TodoNotFound, StorageError],
    }),
  )
  .add(
    HttpApiEndpoint.put("update", "/todos/:id", {
      params: IdParam,
      payload: UpdateTodoSchema,
      success: TodoSchema,
      error: [TodoNotFound, StorageError],
    }),
  )
  .add(
    HttpApiEndpoint.delete("remove", "/todos/:id", {
      params: IdParam,
      success: HttpApiSchema.NoContent,
      error: [TodoNotFound, StorageError],
    }),
  )
  .middleware(Authentication) {}
