import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import { StorageError, type Patch } from "../../db/storage.ts";
import { TodoNotFound, type Todo, type TodoId } from "../schema/todo.schema.model.ts";

export type TodoFilter = { ownerId?: string | undefined };

export interface TodoRepo {
  list: (filter?: TodoFilter) => Effect.Effect<Todo[], StorageError>;
  get: (id: TodoId) => Effect.Effect<Todo, TodoNotFound | StorageError>;
  create: (todo: Todo) => Effect.Effect<Todo, StorageError>;
  update: (id: TodoId, patch: Patch<Todo>) => Effect.Effect<Todo, TodoNotFound | StorageError>;
  remove: (id: TodoId) => Effect.Effect<void, TodoNotFound | StorageError>;
}

export class TodoRepository extends Context.Service<TodoRepository, TodoRepo>()(
  "TodoRepository",
) {}
