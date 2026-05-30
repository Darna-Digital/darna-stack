import * as Schema from "effect/Schema";

export const TodoId = Schema.String.pipe(Schema.brand("TodoId"));
export type TodoId = typeof TodoId.Type;

export const TodoTitle = Schema.Trim.pipe(Schema.check(Schema.isMinLength(1)));

export const TodoSchema = Schema.Struct({
  id: TodoId,
  title: TodoTitle,
  done: Schema.Boolean,
  ownerId: Schema.String,
  createdAt: Schema.String,
});
export type Todo = typeof TodoSchema.Type;

export class TodoNotFound extends Schema.TaggedErrorClass<TodoNotFound>()(
  "TodoNotFound",
  { id: TodoId },
  { httpApiStatus: 404 },
) {}
