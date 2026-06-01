import * as Cloudflare from "alchemy/Cloudflare";
import * as Config from "effect/Config";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Layer from "effect/Layer";
import * as Ref from "effect/Ref";
import type { User } from "../../auth/current-user.ts";
import { Email, bindingEmail, type SendEmailBinding } from "../../../layers/email.layer.ts";
import { withWorkflowTracing } from "../../../observability/tracing.ts";
import type { Task } from "../schema/task.schema.model.ts";

export interface TaskNotificationInput {
  readonly taskId: string;
  readonly title: string;
  readonly projectId: string;
  readonly ownerEmail: string;
  readonly ownerName: string;
  /**
   * Sender address, resolved in the Worker (where `EMAIL_FROM` config is
   * reliably available) and threaded through the durable payload so the
   * workflow never has to read it from its own runtime env.
   */
  readonly emailFrom: string;
}

export interface TaskNotificationResult {
  readonly taskId: string;
  readonly notified: boolean;
  readonly reminded: boolean;
}

const runTaskNotification = (input: TaskNotificationInput) =>
  Effect.gen(function* () {
    const email = yield* Email;

    yield* Cloudflare.task(
      "notify-created",
      email
        .send({
          to: input.ownerEmail,
          subject: `Task added: ${input.title}`,
          text: `Hi ${input.ownerName},\n\nYour task "${input.title}" was added. We'll send a reminder if it's still open.`,
        })
        .pipe(
          Effect.withSpan("step.notify-created", {
            attributes: { "task.id": input.taskId, "task.title": input.title },
          }),
        ),
    );

    yield* Cloudflare.sleep("reminder-delay", "10 seconds");

    yield* Cloudflare.task(
      "send-reminder",
      email
        .send({
          to: input.ownerEmail,
          subject: `Reminder: ${input.title}`,
          text: `Hi ${input.ownerName},\n\nJust a reminder about your task "${input.title}".`,
        })
        .pipe(
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
      const binding = (env as Record<string, unknown>).Email as SendEmailBinding;
      return yield* runTaskNotification(input).pipe(
        Effect.provideService(Email, bindingEmail(binding, input.emailFrom)),
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

export interface TaskNotifierService {
  readonly taskCreated: (task: Task, owner: User) => Effect.Effect<void>;
}

export class TaskNotifier extends Context.Service<TaskNotifier, TaskNotifierService>()(
  "TaskNotifier",
) {}

export const TaskNotifierLive = Layer.effect(
  TaskNotifier,
  Effect.gen(function* () {
    const workflow = yield* TaskNotificationWorkflowService;
    const emailFrom = yield* Config.string("EMAIL_FROM").pipe(Config.withDefault(""));

    return {
      taskCreated: (task, owner) =>
        workflow
          .create({
            taskId: task.id,
            title: task.title,
            projectId: task.projectId,
            ownerEmail: owner.email,
            ownerName: owner.name,
            emailFrom,
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

export interface RecordedNotification {
  readonly task: Task;
  readonly owner: User;
}

export const makeTaskNotifierMemory = Effect.gen(function* () {
  const log = yield* Ref.make<ReadonlyArray<RecordedNotification>>([]);
  return {
    recorded: Ref.get(log),
    layer: Layer.succeed(TaskNotifier, {
      taskCreated: (task, owner) => Ref.update(log, (all) => [...all, { task, owner }]),
    }),
  } as const;
});

export const TaskNotifierMemory = Layer.unwrap(
  Effect.map(makeTaskNotifierMemory, ({ layer }) => layer),
);
