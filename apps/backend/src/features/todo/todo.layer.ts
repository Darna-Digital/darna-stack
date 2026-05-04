import { Layer } from "effect"
import { TodoRepository, makeMemoryTodoRepo } from "./todo.repository.js"
import { Todos } from "./todo.service.js"
import type { Todo } from "./todo.model.js"

export const TodosMemory = (seed: readonly Todo[] = []) =>
  Todos.Default.pipe(
    Layer.provide(Layer.effect(TodoRepository, makeMemoryTodoRepo(seed))),
  )

// TODO: swap to a Drizzle-backed layer once the db repo lands
export const TodosLive = TodosMemory()
