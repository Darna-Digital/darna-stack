import * as Context from "effect/Context";

export interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly emailVerified: boolean;
  readonly image: string | null;
}

export class CurrentUser extends Context.Service<CurrentUser, User>()("CurrentUser") {}
