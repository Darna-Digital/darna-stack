import * as Schema from "effect/Schema";

export const Greeting = Schema.Struct({
  id: Schema.Number,
  text: Schema.String,
});
export type Greeting = (typeof Greeting)["Type"];

export const CreateGreetingFields = {
  text: Schema.String,
};
export const CreateGreeting = Schema.Struct(CreateGreetingFields);
export type CreateGreeting = (typeof CreateGreeting)["Type"];
