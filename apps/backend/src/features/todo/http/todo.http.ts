import { HttpApiBuilder, HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { Effect, Layer, Schema } from "effect"
import { Api } from "../../../api.js"
import { TodosLive } from "../layer/todo.layer.js"
import { TodoNotFound } from "../schema/todo.errors.js"
import { CreateTodo, Todo, TodoId, UpdateTodo } from "../schema/todo.model.js"
import { Todos } from "../service/todo.service.js"

const IdParam = Schema.Struct({ id: TodoId })

export class TodoApi extends HttpApiGroup.make("todo")
  .add(
    HttpApiEndpoint.get("list", "/todos").addSuccess(Schema.Array(Todo)),
  )
  .add(
    HttpApiEndpoint.get("get", "/todos/:id")
      .setPath(IdParam)
      .addSuccess(Todo)
      .addError(TodoNotFound),
  )
  .add(
    HttpApiEndpoint.post("create", "/todos")
      .setPayload(CreateTodo)
      .addSuccess(Todo, { status: 201 }),
  )
  .add(
    HttpApiEndpoint.patch("update", "/todos/:id")
      .setPath(IdParam)
      .setPayload(UpdateTodo)
      .addSuccess(Todo)
      .addError(TodoNotFound),
  )
  .add(
    HttpApiEndpoint.del("remove", "/todos/:id")
      .setPath(IdParam)
      .addSuccess(Schema.Void, { status: 204 })
      .addError(TodoNotFound),
  ) {}

const TodoHandlersLive = HttpApiBuilder.group(Api, "todo", (handlers) =>
  handlers
    .handle("list", () => Todos.list().pipe(Effect.map((arr) => [...arr])))
    .handle("get", ({ path }) => Todos.getById(path.id))
    .handle("create", ({ payload }) => Todos.create(payload))
    .handle("update", ({ path, payload }) => Todos.update(path.id, payload))
    .handle("remove", ({ path }) => Todos.remove(path.id)),
)

export const TodoHandlers = TodoHandlersLive.pipe(Layer.provide(TodosLive))
