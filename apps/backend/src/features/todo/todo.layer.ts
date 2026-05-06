import { Layer } from "effect"
import { TodoRepository } from "./todo.repository.js"
import { createMemoryTodoRepo } from "./todo.repository.memory.js"
import { createDbTodoRepo } from "./todo.repository.db.js"
import { Todos } from "./todo.service.js"
import type { Todo } from "./todo.model.js"

export const TodosMemory = (seed: readonly Todo[] = []) =>
  Todos.Default.pipe(
    Layer.provide(Layer.effect(TodoRepository, createMemoryTodoRepo(seed))),
  )

export const TodosLive = Todos.Default.pipe(
  Layer.provide(Layer.succeed(TodoRepository, createDbTodoRepo)),
)
