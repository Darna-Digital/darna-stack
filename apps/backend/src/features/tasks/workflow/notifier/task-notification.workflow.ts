import * as Cloudflare from "alchemy/Cloudflare";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import { sendEmail } from "../../../../layers/email.layer.ts";
import { withWorkflowTracing } from "../../../../observability/tracing.ts";

export interface TaskNotificationInput {
  readonly taskId: string;
  readonly title: string;
  readonly projectId: string;
  readonly ownerEmail: string;
  readonly ownerName: string;
}

export interface TaskNotificationResult {
  readonly taskId: string;
  readonly notified: boolean;
  readonly reminded: boolean;
}

const REMINDER_DELAY = "1 hour";

const runTaskNotification = (input: TaskNotificationInput) =>
  Effect.gen(function* () {
    yield* Cloudflare.task(
      "notify-created",
      Effect.promise(() =>
        sendEmail({
          to: input.ownerEmail,
          subject: `Task added: ${input.title}`,
          text: `Hey ${input.ownerName},\n\nYour task "${input.title}" was added. We'll send a reminder in ${REMINDER_DELAY} if it's still open.`,
        }),
      ).pipe(
        Effect.withSpan("step.notify-created", {
          attributes: { "task.id": input.taskId, "task.title": input.title },
        }),
      ),
    );

    yield* Cloudflare.sleep("reminder-delay", REMINDER_DELAY);

    yield* Cloudflare.task(
      "send-reminder",
      Effect.promise(() =>
        sendEmail({
          to: input.ownerEmail,
          subject: `Reminder: ${input.title}`,
          text: `Hi ${input.ownerName},\n\nJust a reminder about your task "${input.title}".`,
        }),
      ).pipe(
        Effect.withSpan("step.send-reminder", {
          attributes: { "task.id": input.taskId },
        }),
      ),
    );

    return {
      taskId: input.taskId,
      notified: true,
      reminded: true,
    } satisfies TaskNotificationResult;
  });

export default class TaskNotificationWorkflow extends Cloudflare.Workflow<TaskNotificationWorkflow>()(
  "TaskNotificationWorkflow",
  Effect.gen(function* () {
    return Effect.fn(function* (input: TaskNotificationInput) {
      const env = yield* Cloudflare.WorkerEnvironment;
      return yield* runTaskNotification(input).pipe(
        withWorkflowTracing("workflow.task-notification", env as Record<string, unknown>, {
          "workflow.name": "TaskNotificationWorkflow",
          "task.id": input.taskId,
        }),
      );
    });
  }),
) {}

export class TaskNotificationWorkflowService extends Context.Service<
  TaskNotificationWorkflowService,
  Cloudflare.WorkflowHandle<TaskNotificationInput, TaskNotificationResult>
>()("TaskNotificationWorkflowService") {}
