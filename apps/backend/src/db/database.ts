import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import * as Drizzle from "alchemy/Drizzle";

/** Type of the Effect-Drizzle Postgres db produced by `Drizzle.postgres`. */
type DbType = Effect.Success<ReturnType<typeof Drizzle.postgres>>;

/**
 * The Drizzle Postgres database, provided once per isolate from the Hyperdrive
 * connection in the Worker's init phase. Handlers `yield* Database`.
 */
export class Database extends Context.Service<Database, DbType>()("Database") {}
