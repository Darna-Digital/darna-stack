import * as Cloudflare from "alchemy/Cloudflare";
import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import { withWorkflowTracing } from "../../observability/tracing.ts";

/** Payload a caller sends to start a greeting workflow. */
export interface GreetingInput {
  readonly name: string;
}

/** What the workflow produces once it completes. */
export interface GreetingResult {
  readonly greeting: string;
  readonly steps: number;
}

/**
 * The durable body: two `task` steps with a `sleep` between them. Each step
 * gets its own span; `Cloudflare.task` threads the surrounding context (incl.
 * the tracer installed by `withWorkflowTracing`) into the step effect, so the
 * step spans nest under the workflow's root span.
 */
const runGreeting = (input: GreetingInput) =>
  Effect.gen(function* () {
    const greeting = yield* Cloudflare.task(
      "build-greeting",
      Effect.succeed(`Hello, ${input.name}!`).pipe(
        Effect.withSpan("step.build-greeting", {
          attributes: { "greeting.name": input.name },
        }),
      ),
    );

    yield* Cloudflare.sleep("cooldown", "30 seconds");

    const result = yield* Cloudflare.task(
      "finalize",
      Effect.succeed({ greeting, steps: 2 } satisfies GreetingResult).pipe(
        Effect.withSpan("step.finalize", {
          attributes: { "greeting.text": greeting },
        }),
      ),
    );

    return result;
  });

/**
 * Example Cloudflare Workflow. Bind it in the Worker init phase (`yield*
 * GreetingWorkflow`) to register the binding + Workflows API resource and get a
 * handle for starting/inspecting instances.
 */
export default class GreetingWorkflow extends Cloudflare.Workflow<GreetingWorkflow>()(
  "GreetingWorkflow",
  Effect.gen(function* () {
    // Phase 1 (bind-time): nothing to resolve for this example.
    return Effect.fn(function* (input: GreetingInput) {
      // Phase 2 (runtime): emit OTel around the durable steps. The workflow
      // shares the Worker's bound OTel vars/secrets via `WorkerEnvironment`.
      const env = yield* Cloudflare.WorkerEnvironment;
      return yield* runGreeting(input).pipe(
        withWorkflowTracing("workflow.greeting", env as Record<string, unknown>, {
          "workflow.name": "GreetingWorkflow",
          "greeting.name": input.name,
        }),
      );
    });
  }),
) {}

/** The workflow handle, provided to API handlers so they can start/poll runs. */
export class GreetingWorkflowService extends Context.Service<
  GreetingWorkflowService,
  Cloudflare.WorkflowHandle<GreetingInput, GreetingResult>
>()("GreetingWorkflowService") {}
