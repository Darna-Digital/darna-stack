import * as Schema from "effect/Schema";

/** A greeting returned by the API. */
export const Greeting = Schema.Struct({
  id: Schema.Number,
  text: Schema.String,
});
export type Greeting = (typeof Greeting)["Type"];

/**
 * Request body for creating a greeting. Effect 4's HttpApiEndpoint takes the
 * payload as a *fields record*, so we expose the fields and also build a Struct
 * from them for reuse/typing.
 */
export const CreateGreetingFields = {
  text: Schema.String,
};
export const CreateGreeting = Schema.Struct(CreateGreetingFields);
export type CreateGreeting = (typeof CreateGreeting)["Type"];
