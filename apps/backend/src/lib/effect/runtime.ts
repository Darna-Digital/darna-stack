import { Layer, ManagedRuntime } from "effect"
import { TodosLive } from "../../features/todo/todo.layer.js"
import { TracingLayer } from "./tracing.js"

// TODO: add StorageLayer (Drizzle + Postgres/MySQL client)
// TODO: add AuthLayer (CurrentUser context tag)
// TODO: add RateLimiter layer
const AppLayer = Layer.mergeAll(TracingLayer, TodosLive)

export const AppRuntime = ManagedRuntime.make(AppLayer)
export type AppEnv = ManagedRuntime.ManagedRuntime.Context<typeof AppRuntime>
