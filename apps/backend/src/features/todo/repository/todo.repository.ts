import { Context, Effect } from "effect"
import type { CreateTodo, Todo, TodoId, UpdateTodo } from "../schema/todo.model.js"

export interface TodoRepo {
  readonly list: () => Effect.Effect<readonly Todo[]>
  readonly findById: (id: TodoId) => Effect.Effect<Todo | undefined>
  readonly create: (input: CreateTodo) => Effect.Effect<Todo>
  readonly update: (
    id: TodoId,
    patch: UpdateTodo,
  ) => Effect.Effect<Todo | undefined>
  readonly remove: (id: TodoId) => Effect.Effect<boolean>
}

export class TodoRepository extends Context.Tag("TodoRepository")<
  TodoRepository,
  TodoRepo
>() {}
