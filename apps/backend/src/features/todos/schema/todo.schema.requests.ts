import * as Schema from "effect/Schema";
import { TodoTitle } from "./todo.schema.model.ts";

export const CreateTodoSchema = Schema.Struct({
  title: TodoTitle,
});
export type CreateTodo = typeof CreateTodoSchema.Type;

export const UpdateTodoSchema = Schema.Struct({
  title: Schema.optionalKey(TodoTitle),
  done: Schema.optionalKey(Schema.Boolean),
});
export type UpdateTodo = typeof UpdateTodoSchema.Type;
