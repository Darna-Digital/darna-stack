import { HttpApiBuilder } from "effect/unstable/httpapi";
import * as Effect from "effect/Effect";
import { Api } from "../api.ts";
import { GreetingWorkflowService } from "./greeting.workflow.ts";

export const WorkflowsHandlers = HttpApiBuilder.group(Api, "workflows", (handlers) =>
  Effect.gen(function* () {
    const workflow = yield* GreetingWorkflowService;
    return handlers
      .handle("start", ({ payload }) =>
        workflow
          .create({ name: payload.name })
          .pipe(Effect.map((instance) => ({ instanceId: instance.id }))),
      )
      .handle("status", ({ params }) =>
        Effect.gen(function* () {
          const instance = yield* workflow.get(params.instanceId);
          const status = yield* instance.status();
          return {
            status: status.status,
            output: status.output ?? null,
            error: status.error ? status.error.message : null,
          };
        }),
      );
  }),
);
