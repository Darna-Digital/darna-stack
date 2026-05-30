import * as Schema from "effect/Schema";

export const User = Schema.Struct({
  id: Schema.Number,
  email: Schema.String,
  name: Schema.String,
});
export type User = (typeof User)["Type"];

export const CreateUser = Schema.Struct({
  email: Schema.String,
  name: Schema.String,
});
export type CreateUser = (typeof CreateUser)["Type"];
