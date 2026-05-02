import { Layer } from "effect"
import { TodoRepository, makeMemoryTodoRepo } from "./todo.repository.js"
import { Todos } from "./todo.service.js"

// TODO: swap memory repo for db repo once Drizzle is wired up
export const TodosLive = Todos.Default.pipe(
  Layer.provide(Layer.effect(TodoRepository, makeMemoryTodoRepo())),
)
