import { Effect } from "effect"
import { TodoRepository } from "../repository/todo.repository.js"
import { TodoNotFound } from "../schema/todo.errors.js"
import type { CreateTodo, Todo, TodoId, UpdateTodo } from "../schema/todo.model.js"

export class Todos extends Effect.Service<Todos>()("Todos", {
  accessors: true,
  effect: Effect.gen(function* () {
    const repo = yield* TodoRepository

    const list = (): Effect.Effect<readonly Todo[]> =>
      repo.list().pipe(Effect.withSpan("Todos.list"))

    const getById = (id: TodoId): Effect.Effect<Todo, TodoNotFound> =>
      Effect.gen(function* () {
        const todo = yield* repo.findById(id)
        if (!todo) return yield* Effect.fail(new TodoNotFound({ id }))
        return todo
      }).pipe(Effect.withSpan("Todos.getById", { attributes: { "todo.id": id } }))

    const create = (input: CreateTodo): Effect.Effect<Todo> =>
      repo.create(input).pipe(Effect.withSpan("Todos.create"))

    const update = (
      id: TodoId,
      patch: UpdateTodo,
    ): Effect.Effect<Todo, TodoNotFound> =>
      Effect.gen(function* () {
        const todo = yield* repo.update(id, patch)
        if (!todo) return yield* Effect.fail(new TodoNotFound({ id }))
        return todo
      }).pipe(Effect.withSpan("Todos.update", { attributes: { "todo.id": id } }))

    const remove = (id: TodoId): Effect.Effect<void, TodoNotFound> =>
      Effect.gen(function* () {
        const removed = yield* repo.remove(id)
        if (!removed) return yield* Effect.fail(new TodoNotFound({ id }))
      }).pipe(Effect.withSpan("Todos.remove", { attributes: { "todo.id": id } }))

    return { list, getById, create, update, remove } as const
  }),
}) {}
