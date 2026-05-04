import { HttpApiBuilder } from "@effect/platform"
import { Effect } from "effect"
import { Api } from "../../api.js"
import { Todos } from "./todo.service.js"

export const TodoHandlers = HttpApiBuilder.group(Api, "todo", (handlers) =>
  handlers
    .handle("list", () => Todos.list().pipe(Effect.map((arr) => [...arr])))
    .handle("get", ({ path }) => Todos.getById(path.id))
    .handle("create", ({ payload }) => Todos.create(payload))
    .handle("update", ({ path, payload }) => Todos.update(path.id, payload))
    .handle("remove", ({ path }) => Todos.remove(path.id)),
)
