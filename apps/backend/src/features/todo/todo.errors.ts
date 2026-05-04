import { Data } from "effect"
import { z } from "zod"
import type { TodoId } from "./todo.model.js"

export class TodoNotFound extends Data.TaggedError("TodoNotFound")<{
  readonly id: TodoId
}> {}

export const todoErrorCatalog = {
  TodoNotFound: {
    code: "TODO_NOT_FOUND",
    status: 404,
    message: "Todo not found",
    data: z.object({ id: z.string() }),
    toData: (e: TodoNotFound) => ({ id: e.id as string }),
  },
} as const
