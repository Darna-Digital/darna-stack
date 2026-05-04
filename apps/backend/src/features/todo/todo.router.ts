import { Effect } from "effect"
import { z } from "zod"
import { base, runEffect } from "../../lib/effect/orpc.js"
import { Todos } from "./todo.service.js"
import { CreateTodo, Todo, TodoId, UpdateTodo } from "./todo.model.js"

export const todoRouter = {
  list: base
    .route({ method: "GET", path: "/todos" })
    .output(z.array(Todo))
    .handler(({ signal, errors }) =>
      runEffect(
        "todo.list",
        Todos.list().pipe(Effect.map((arr) => [...arr])),
        errors,
        signal,
      ),
    ),

  get: base
    .route({ method: "GET", path: "/todos/{id}" })
    .input(z.object({ id: TodoId }))
    .output(Todo)
    .handler(({ input, signal, errors }) =>
      runEffect("todo.get", Todos.getById(input.id), errors, signal),
    ),

  create: base
    .route({ method: "POST", path: "/todos" })
    .input(CreateTodo)
    .output(Todo)
    .handler(({ input, signal, errors }) =>
      runEffect("todo.create", Todos.create(input), errors, signal),
    ),

  update: base
    .route({ method: "PATCH", path: "/todos/{id}" })
    .input(z.object({ id: TodoId, patch: UpdateTodo }))
    .output(Todo)
    .handler(({ input, signal, errors }) =>
      runEffect(
        "todo.update",
        Todos.update(input.id, input.patch),
        errors,
        signal,
      ),
    ),

  remove: base
    .route({ method: "DELETE", path: "/todos/{id}" })
    .input(z.object({ id: TodoId }))
    .output(z.void())
    .handler(({ input, signal, errors }) =>
      runEffect("todo.remove", Todos.remove(input.id), errors, signal),
    ),
}
