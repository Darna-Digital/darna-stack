import type { Context } from "hono"
import { Effect } from "effect"
import { AppRuntime, type AppEnv } from "./runtime.js"

/**
 * Bridges a Hono request to an Effect, runs it on the AppRuntime, and
 * renders RenderableErrors via `.toResponse()`. Adds an OpenTelemetry span
 * named after the route — opencode-style `runRequest` helper.
 *
 * TODO: annotate span with request attributes (method, path, status code)
 * TODO: catch ParseError uniformly and return 400 (currently per-route)
 */
export interface RenderableError {
  toResponse(): Response
}

const isRenderableError = (e: unknown): e is RenderableError =>
  typeof e === "object" && e !== null && typeof (e as { toResponse?: unknown }).toResponse === "function"

export const runRoute = <A, E>(
  span: string,
  _c: Context,
  effect: Effect.Effect<A, E, AppEnv>,
): Promise<Response> =>
  AppRuntime.runPromise(
    effect.pipe(
      Effect.withSpan(span),
      Effect.matchEffect({
        onFailure: (e) =>
          Effect.sync(() =>
            isRenderableError(e)
              ? e.toResponse()
              : Response.json({ error: "InternalServerError" }, { status: 500 }),
          ),
        onSuccess: (value) => Effect.sync(() => Response.json(value)),
      }),
    ),
  )
