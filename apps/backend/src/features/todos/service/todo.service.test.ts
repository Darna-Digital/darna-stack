import { describe, expect } from "vitest";
import { it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { Todos } from "./todo.service.ts";
import { TodosMemory } from "../layer/todo.layer.memory.ts";
import { CurrentUser, type User } from "../../auth/current-user.ts";
import type { Todo, TodoId } from "../schema/todo.schema.model.ts";

const mkUser = (id: string, email: string): User => ({
  id,
  email,
  name: email.split("@")[0]!,
  emailVerified: true,
  image: null,
});

const alice = mkUser("user-alice", "alice@example.com");
const bob = mkUser("user-bob", "bob@example.com");

const env = (opts?: { todos?: readonly Todo[]; user?: User }) =>
  Layer.mergeAll(
    TodosMemory({ seed: opts?.todos ?? [] }),
    Layer.succeed(CurrentUser, opts?.user ?? alice),
  );

const todo = (id: string, ownerId: string, title: string, done = false): Todo => ({
  id: id as TodoId,
  title,
  done,
  ownerId,
  createdAt: "2026-01-01T00:00:00.000Z",
});

describe("Todos.create", () => {
  it.effect("stamps the current user as owner — identity from context", () =>
    Effect.gen(function* () {
      const todos = yield* Todos;
      const created = yield* todos.create({ title: "Buy milk" });
      expect(created.ownerId).toBe(bob.id);
      expect(created.title).toBe("Buy milk");
      expect(created.done).toBe(false);
    }).pipe(Effect.provide(env({ user: bob }))),
  );
});

describe("Todos.mine", () => {
  const seed = [
    todo("t-1", alice.id, "Alice 1"),
    todo("t-2", alice.id, "Alice 2"),
    todo("t-3", bob.id, "Bob 1"),
  ];

  it.effect("returns only the current user's todos", () =>
    Effect.gen(function* () {
      const todos = yield* Todos;
      const mine = yield* todos.mine();
      expect(mine.map((t) => t.id).sort()).toEqual(["t-1", "t-2"]);
    }).pipe(Effect.provide(env({ todos: seed, user: alice }))),
  );

  it.effect("scopes to bob when bob is the current user", () =>
    Effect.gen(function* () {
      const todos = yield* Todos;
      const mine = yield* todos.mine();
      expect(mine.map((t) => t.id)).toEqual(["t-3"]);
    }).pipe(Effect.provide(env({ todos: seed, user: bob }))),
  );
});

describe("Todos.update / remove", () => {
  it.effect("updates a todo's done flag", () =>
    Effect.gen(function* () {
      const todos = yield* Todos;
      const updated = yield* todos.update("t-1" as TodoId, { done: true });
      expect(updated.done).toBe(true);
    }).pipe(Effect.provide(env({ todos: [todo("t-1", alice.id, "x")] }))),
  );

  it.effect("fails with TodoNotFound for a missing id", () =>
    Effect.gen(function* () {
      const todos = yield* Todos;
      const error = yield* Effect.flip(todos.update("missing" as TodoId, { done: true }));
      expect((error as { _tag: string })._tag).toBe("TodoNotFound");
    }).pipe(Effect.provide(env())),
  );

  it.effect("removes a todo", () =>
    Effect.gen(function* () {
      const todos = yield* Todos;
      yield* todos.remove("t-1" as TodoId);
      const error = yield* Effect.flip(todos.getById("t-1" as TodoId));
      expect((error as { _tag: string })._tag).toBe("TodoNotFound");
    }).pipe(Effect.provide(env({ todos: [todo("t-1", alice.id, "x")] }))),
  );
});
