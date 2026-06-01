import * as Context from "effect/Context";

/** The authenticated user, derived from the better-auth session. */
export interface User {
  readonly id: string;
  readonly email: string;
  readonly name: string;
  readonly emailVerified: boolean;
  readonly image: string | null;
}

/**
 * The current request's user. Provided by the {@link Authentication} middleware
 * and `yield*`-ed by services that act on behalf of the caller. In tests it's
 * supplied directly via `Layer.succeed(CurrentUser, mockUser)`.
 */
export class CurrentUser extends Context.Service<CurrentUser, User>()("CurrentUser") {}
