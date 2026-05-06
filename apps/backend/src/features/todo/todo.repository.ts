import { Context, Effect } from "effect"
import type { StorageError } from "../../lib/effect/storage.js"
import type { CreateTodo, Todo, TodoId, UpdateTodo } from "./todo.model.js"

export interface TodoRepo {
  readonly list: () => Effect.Effect<readonly Todo[], StorageError>
  readonly findById: (
    id: TodoId,
  ) => Effect.Effect<Todo | undefined, StorageError>
  readonly create: (input: CreateTodo) => Effect.Effect<Todo, StorageError>
  readonly update: (
    id: TodoId,
    patch: UpdateTodo,
  ) => Effect.Effect<Todo | undefined, StorageError>
  readonly remove: (id: TodoId) => Effect.Effect<boolean, StorageError>
}

export class TodoRepository extends Context.Tag("TodoRepository")<
  TodoRepository,
  TodoRepo
>() {}
