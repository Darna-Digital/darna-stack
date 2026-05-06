import { describe, expect, it } from "vitest"
import { Effect, Either } from "effect"
import { TodosMemory } from "../layer/todo.layer.js"
import { Todos } from "./todo.service.js"
import type { Todo, TodoId } from "../schema/todo.model.js"

const run = <Success, Failure>(
  effect: Effect.Effect<Success, Failure, Todos>,
  options?: { seed?: readonly Todo[] },
) =>
  Effect.runPromise(
    effect.pipe(Effect.either, Effect.provide(TodosMemory(options?.seed))),
  )

const seedTodo: Todo = {
  id: "11111111-1111-4111-8111-111111111111" as TodoId,
  title: "seed",
  done: false,
  createdAt: "2026-01-01T00:00:00.000Z",
}

describe("Todos.create", () => {
  it("stores a new todo with done=false and a generated id", async () => {
    const result = await run(Todos.create({ title: "buy milk" }))
    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right.title).toBe("buy milk")
      expect(result.right.done).toBe(false)
      expect(result.right.id).toMatch(/^[0-9a-f-]{36}$/)
    }
  })

  it("appends to the seed", async () => {
    const result = await run(
      Effect.gen(function* () {
        yield* Todos.create({ title: "second" })
        return yield* Todos.list()
      }),
      { seed: [seedTodo] },
    )
    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right).toHaveLength(2)
      expect(result.right.map((t) => t.title)).toContain("second")
    }
  })
})

describe("Todos.getById", () => {
  it("returns the todo when it exists", async () => {
    const result = await run(Todos.getById(seedTodo.id), { seed: [seedTodo] })
    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) expect(result.right.title).toBe("seed")
  })

  it("fails with TodoNotFound when the id is unknown", async () => {
    const missing = "00000000-0000-4000-8000-000000000000" as TodoId
    const result = await run(Todos.getById(missing))
    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result) && result.left._tag === "TodoNotFound") {
      expect(result.left.id).toBe(missing)
    }
  })
})

describe("Todos.update", () => {
  it("merges patch fields", async () => {
    const result = await run(
      Todos.update(seedTodo.id, { done: true, title: "renamed" }),
      { seed: [seedTodo] },
    )
    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) {
      expect(result.right.done).toBe(true)
      expect(result.right.title).toBe("renamed")
    }
  })

  it("fails with TodoNotFound for an unknown id", async () => {
    const result = await run(
      Todos.update("99999999-9999-4999-8999-999999999999" as TodoId, {
        done: true,
      }),
    )
    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result))
      expect(result.left._tag).toBe("TodoNotFound")
  })
})

describe("Todos.remove", () => {
  it("removes an existing todo", async () => {
    const result = await run(
      Effect.gen(function* () {
        yield* Todos.remove(seedTodo.id)
        return yield* Todos.list()
      }),
      { seed: [seedTodo] },
    )
    expect(Either.isRight(result)).toBe(true)
    if (Either.isRight(result)) expect(result.right).toHaveLength(0)
  })

  it("fails with TodoNotFound when the id is unknown", async () => {
    const result = await run(
      Todos.remove("88888888-8888-4888-8888-888888888888" as TodoId),
    )
    expect(Either.isLeft(result)).toBe(true)
    if (Either.isLeft(result))
      expect(result.left._tag).toBe("TodoNotFound")
  })
})
