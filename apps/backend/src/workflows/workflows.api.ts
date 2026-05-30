import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";
import * as Schema from "effect/Schema";
import { StartGreeting, WorkflowStarted, WorkflowStatus } from "./workflows.model.ts";

/** The `workflows` API group: start a greeting workflow and poll its status. */
export class WorkflowsApi extends HttpApiGroup.make("workflows")
  .add(
    HttpApiEndpoint.post("start", "/workflows/greeting", {
      payload: StartGreeting,
      success: WorkflowStarted,
    }),
  )
  .add(
    HttpApiEndpoint.get("status", "/workflows/greeting/:instanceId", {
      params: { instanceId: Schema.String },
      success: WorkflowStatus,
    }),
  ) {}
