import { HttpApiEndpoint, HttpApiGroup } from "effect/unstable/httpapi";
import * as Schema from "effect/Schema";
import { StartGreeting, WorkflowStarted, WorkflowStatus } from "./workflows.model.ts";

/**
 * A run of the greeting workflow, modeled as a CRUD resource (NWCA): starting a
 * run is `store`, polling it is `show`. Replaces the custom start/status verbs.
 */
export class GreetingRunsApi extends HttpApiGroup.make("greetingRuns")
  .add(
    HttpApiEndpoint.post("store", "/greeting-runs", {
      payload: StartGreeting,
      success: WorkflowStarted,
    }),
  )
  .add(
    HttpApiEndpoint.get("show", "/greeting-runs/:instanceId", {
      params: { instanceId: Schema.String },
      success: WorkflowStatus,
    }),
  ) {}
