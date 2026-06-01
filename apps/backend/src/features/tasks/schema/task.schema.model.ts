import * as Schema from "effect/Schema";

export const TaskId = Schema.String.pipe(Schema.brand("TaskId"));
export type TaskId = typeof TaskId.Type;

export const TaskTitle = Schema.Trim.pipe(Schema.check(Schema.isMinLength(1)));

export const TaskSchema = Schema.Struct({
  id: TaskId,
  title: TaskTitle,
  done: Schema.Boolean,
  projectId: Schema.String,
  createdAt: Schema.String,
});
export type Task = typeof TaskSchema.Type;

export class TaskNotFound extends Schema.TaggedErrorClass<TaskNotFound>()(
  "TaskNotFound",
  { id: TaskId },
  { httpApiStatus: 404 },
) {}
