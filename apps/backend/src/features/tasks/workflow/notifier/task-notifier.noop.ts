import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { TaskNotifier } from "./task-notifier.ts";

export const TaskNotifierNoop = Layer.succeed(TaskNotifier, {
  taskCreated: () => Effect.void,
});
