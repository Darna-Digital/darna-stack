import { os, type ORPCErrorConstructorMap } from "@orpc/server"
import { Cause, Effect, Exit } from "effect"
import { z } from "zod"
import { todoErrorCatalog } from "../../features/todo/todo.errors.js"
import { AppRuntime, type AppEnv } from "./runtime.js"

export type RpcContext = { request: Request }

const directErrors = {
  UNAUTHORIZED: {
    status: 401,
    message: "Authentication required",
    data: z.object({ reason: z.string() }),
  },
} as const

const effectCatalog = {
  ...todoErrorCatalog,
} as const

type EffectCatalog = typeof effectCatalog
type EffectEntry = EffectCatalog[keyof EffectCatalog]

type EffectErrorMap = {
  readonly [K in EffectEntry["code"]]: Extract<
    EffectEntry,
    { code: K }
  > extends {
    status: infer S
    message: infer M
    data: infer D
  }
    ? { status: S; message: M; data: D }
    : never
}

const effectErrorMap = Object.fromEntries(
  Object.values(effectCatalog).map((d) => [
    d.code,
    { status: d.status, message: d.message, data: d.data },
  ]),
) as EffectErrorMap

const orpcErrorMap = { ...directErrors, ...effectErrorMap }
type OrpcErrorMap = typeof directErrors & EffectErrorMap

export const base = os.$context<RpcContext>().errors(orpcErrorMap)

const tagToEntry = effectCatalog as Record<
  string,
  { code: string; toData: (e: unknown) => unknown }
>

export const runEffect = <A, E>(
  span: string,
  effect: Effect.Effect<A, E, AppEnv>,
  errors: ORPCErrorConstructorMap<OrpcErrorMap>,
  signal?: AbortSignal,
): Promise<A> =>
  AppRuntime.runPromiseExit(
    effect.pipe(
      Effect.withSpan(span),
      Effect.mapError((e): unknown => {
        const tag = (e as { _tag?: string })._tag
        const entry = tag ? tagToEntry[tag] : undefined
        if (entry) {
          const ctor = (errors as unknown as Record<
            string,
            (i: { data: unknown }) => Error
          >)[entry.code]
          return ctor({ data: entry.toData(e) })
        }
        return e
      }),
    ),
    { signal },
  ).then((exit) => {
    if (Exit.isSuccess(exit)) return exit.value
    const failure = Cause.failureOption(exit.cause)
    if (failure._tag === "Some") throw failure.value
    throw Cause.squash(exit.cause)
  })
