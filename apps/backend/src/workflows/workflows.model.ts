import * as Schema from "effect/Schema";

/** Request body for starting the greeting workflow (a fields record, reused as a Struct). */
export const StartGreetingFields = {
  name: Schema.String,
};
export const StartGreeting = Schema.Struct(StartGreetingFields);
export type StartGreeting = (typeof StartGreeting)["Type"];

/** Returned when a workflow instance is started. */
export const WorkflowStarted = Schema.Struct({
  instanceId: Schema.String,
});
export type WorkflowStarted = (typeof WorkflowStarted)["Type"];

/** The workflow's result payload (mirrors `GreetingResult`). */
export const GreetingResultSchema = Schema.Struct({
  greeting: Schema.String,
  steps: Schema.Number,
});

/** Current status of a workflow instance, with the result once complete. */
export const WorkflowStatus = Schema.Struct({
  status: Schema.String,
  output: Schema.NullOr(GreetingResultSchema),
  error: Schema.NullOr(Schema.String),
});
export type WorkflowStatus = (typeof WorkflowStatus)["Type"];
