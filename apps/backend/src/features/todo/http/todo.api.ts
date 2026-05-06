import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { Schema } from "effect"
import { TodoNotFound } from "../schema/todo.errors.js"
import { CreateTodo, Todo, TodoId, UpdateTodo } from "../schema/todo.model.js"

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
