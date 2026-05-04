import { HttpApiSchema } from "@effect/platform"
import { Schema } from "effect"
import { TodoId } from "./todo.model.js"

export class TodoNotFound extends Schema.TaggedError<TodoNotFound>()(
  "TodoNotFound",
  { id: TodoId },
  HttpApiSchema.annotations({ status: 404 }),
) {}
