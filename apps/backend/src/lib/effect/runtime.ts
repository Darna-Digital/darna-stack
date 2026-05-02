import { Layer, ManagedRuntime } from "effect"
import { TodosLive } from "@/features/todo/todo.layer.js"

// TODO: add TracingLayer (OpenTelemetry) — see nextjs-effect-starter/lib/effect/layers/tracing.ts
// TODO: add StorageLayer (Drizzle + Postgres/MySQL client)
// TODO: add AuthLayer (CurrentUser context tag)
// TODO: add RateLimiter layer
const AppLayer = Layer.mergeAll(TodosLive)

export const AppRuntime = ManagedRuntime.make(AppLayer)
export type AppEnv = ManagedRuntime.ManagedRuntime.Context<typeof AppRuntime>
