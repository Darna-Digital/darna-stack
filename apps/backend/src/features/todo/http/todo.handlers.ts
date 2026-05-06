import { HttpApiBuilder } from "@effect/platform"
import { Effect, Layer } from "effect"
import { Api } from "../../../api.js"
import { TodosLive } from "../layer/todo.layer.js"
import { Todos } from "../service/todo.service.js"

const TodoHandlersLive = HttpApiBuilder.group(Api, "todo", (handlers) =>
  handlers
    .handle("list", () => Todos.list().pipe(Effect.map((arr) => [...arr])))
    .handle("get", ({ path }) => Todos.getById(path.id))
    .handle("create", ({ payload }) => Todos.create(payload))
    .handle("update", ({ path, payload }) => Todos.update(path.id, payload))
    .handle("remove", ({ path }) => Todos.remove(path.id)),
)

export const TodoHandlers = TodoHandlersLive.pipe(Layer.provide(TodosLive))
