import { Data, Effect } from "effect"

export class StorageError extends Data.TaggedError("StorageError")<{
  readonly cause: unknown
}> {}

export type Patch<Row> = {
  [Key in keyof Omit<Row, "id">]?: Omit<Row, "id">[Key] | undefined
}

const DB_SPAN_ATTRS = { "db.system": "postgresql" } as const

export const tryDb = <Result>(name: string, run: () => Promise<Result>) =>
  Effect.tryPromise({
    try: run,
    catch: (cause) => new StorageError({ cause }),
  }).pipe(Effect.withSpan(name, { attributes: DB_SPAN_ATTRS }))

export const stripNulls = <Row>(row: object): Row => {
  const out: Record<string, unknown> = {}
  for (const key in row) {
    const value = (row as Record<string, unknown>)[key]
    if (value !== null) out[key] = value
  }
  return out as Row
}
