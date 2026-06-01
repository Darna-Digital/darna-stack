import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import { TaskNotificationWorkflowService } from "./task-notification.workflow.ts";
import { TaskNotifier } from "./task-notifier.ts";

export const TaskNotifierLive = Layer.effect(
  TaskNotifier,
  Effect.gen(function* () {
    const workflow = yield* TaskNotificationWorkflowService;

    return {
      taskCreated: (task, owner) =>
        workflow
          .create({
            taskId: task.id,
            title: task.title,
            projectId: task.projectId,
            ownerEmail: owner.email,
            ownerName: owner.name,
          })
          .pipe(
            Effect.flatMap((instance) =>
              Effect.logInfo("Started task-notification workflow").pipe(
                Effect.annotateLogs({
                  "workflow.instance_id": instance.id,
                  "task.id": task.id,
                }),
              ),
            ),
            Effect.catchCause((cause) =>
              Effect.logError("Failed to start task-notification workflow", cause),
            ),
          ),
    };
  }),
);
