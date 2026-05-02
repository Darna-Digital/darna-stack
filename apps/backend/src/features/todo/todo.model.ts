import { Data } from "effect"
import { z } from "zod"

export const TodoId = z.string().uuid().brand<"TodoId">()
export type TodoId = z.infer<typeof TodoId>

export const Todo = z.object({
  id: TodoId,
  title: z.string().min(1).max(200),
  done: z.boolean(),
  createdAt: z.string().datetime(),
})
export type Todo = z.infer<typeof Todo>

export const CreateTodo = z.object({
  title: z.string().min(1).max(200),
})
export type CreateTodo = z.infer<typeof CreateTodo>

export const UpdateTodo = z.object({
  title: z.string().min(1).max(200).optional(),
  done: z.boolean().optional(),
})
export type UpdateTodo = z.infer<typeof UpdateTodo>

export class TodoNotFound extends Data.TaggedError("TodoNotFound")<{
  readonly id: TodoId
}> {
  toResponse(): Response {
    return Response.json({ error: "TodoNotFound", id: this.id }, { status: 404 })
  }
}
