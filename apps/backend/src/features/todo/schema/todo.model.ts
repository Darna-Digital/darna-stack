import { Schema } from "effect"

export const TodoId = Schema.UUID.pipe(Schema.brand("TodoId"))
export type TodoId = typeof TodoId.Type

export const Todo = Schema.Struct({
  id: TodoId,
  title: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(200)),
  done: Schema.Boolean,
  createdAt: Schema.String,
})
export type Todo = typeof Todo.Type

export const CreateTodo = Schema.Struct({
  title: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(200)),
})
export type CreateTodo = typeof CreateTodo.Type

export const UpdateTodo = Schema.Struct({
  title: Schema.optional(
    Schema.String.pipe(Schema.minLength(1), Schema.maxLength(200)),
  ),
  done: Schema.optional(Schema.Boolean),
})
export type UpdateTodo = typeof UpdateTodo.Type
