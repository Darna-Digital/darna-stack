import { Effect, Ref } from "effect"
import type { TodoRepo } from "./todo.repository.js"
import type { Todo, TodoId } from "./todo.model.js"

export const createMemoryTodoRepo = (
  seed: readonly Todo[] = [],
): Effect.Effect<TodoRepo> =>
  Effect.gen(function* () {
    const ref = yield* Ref.make<Map<TodoId, Todo>>(
      new Map(seed.map((t) => [t.id, t])),
    )

    const list: TodoRepo["list"] = () =>
      Ref.get(ref).pipe(Effect.map((m) => Array.from(m.values())))

    const findById: TodoRepo["findById"] = (id) =>
      Ref.get(ref).pipe(Effect.map((m) => m.get(id)))

    const create: TodoRepo["create"] = (input) =>
      Effect.sync(() => crypto.randomUUID()).pipe(
        Effect.flatMap((rawId) => {
          const todo: Todo = {
            id: rawId as Todo["id"],
            title: input.title,
            done: false,
            createdAt: new Date().toISOString(),
          }
          return Ref.update(ref, (m) => new Map(m).set(todo.id, todo)).pipe(
            Effect.as(todo),
          )
        }),
      )

    const update: TodoRepo["update"] = (id, patch) =>
      Ref.modify(ref, (m) => {
        const existing = m.get(id)
        if (!existing) return [undefined, m] as const
        const next: Todo = {
          ...existing,
          ...(patch.title !== undefined ? { title: patch.title } : {}),
          ...(patch.done !== undefined ? { done: patch.done } : {}),
        }
        const nextMap = new Map(m).set(id, next)
        return [next, nextMap] as const
      })

    const remove: TodoRepo["remove"] = (id) =>
      Ref.modify(ref, (m) => {
        if (!m.has(id)) return [false, m] as const
        const nextMap = new Map(m)
        nextMap.delete(id)
        return [true, nextMap] as const
      })

    return { list, findById, create, update, remove }
  })
