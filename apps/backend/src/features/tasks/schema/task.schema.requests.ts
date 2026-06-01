import * as Schema from "effect/Schema";
import { TaskTitle } from "./task.schema.model.ts";

export const CreateTaskSchema = Schema.Struct({
  title: TaskTitle,
});
export type CreateTask = typeof CreateTaskSchema.Type;

export const UpdateTaskSchema = Schema.Struct({
  title: Schema.optionalKey(TaskTitle),
  done: Schema.optionalKey(Schema.Boolean),
});
export type UpdateTask = typeof UpdateTaskSchema.Type;
