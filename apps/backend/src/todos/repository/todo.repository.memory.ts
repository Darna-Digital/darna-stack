import * as Effect from "effect/Effect";
import * as Ref from "effect/Ref";
import { TodoNotFound, type Todo } from "../schema/todo.schema.model.ts";
import type { TodoRepo } from "./todo.repository.ts";

/** In-memory repository for unit tests — no database required. */
export const makeMemoryTodoRepository = (seed: readonly Todo[] = []) =>
  Effect.gen(function* () {
    const store = yield* Ref.make<Todo[]>([...seed]);

    const repo: TodoRepo = {
      list: (filter = {}) =>
        Ref.get(store).pipe(
          Effect.map((items) =>
            items.filter((t) => !filter.ownerId || t.ownerId === filter.ownerId),
          ),
        ),

      get: (id) =>
        Ref.get(store).pipe(
          Effect.flatMap((items) => {
            const found = items.find((t) => t.id === id);
            return found ? Effect.succeed(found) : Effect.fail(new TodoNotFound({ id }));
          }),
        ),

      create: (todo) => Ref.update(store, (items) => [...items, todo]).pipe(Effect.as(todo)),

      update: (id, patch) =>
        Ref.get(store).pipe(
          Effect.flatMap((items) => {
            const index = items.findIndex((t) => t.id === id);
            if (index === -1) return Effect.fail(new TodoNotFound({ id }));
            const updated = { ...items[index], ...patch } as Todo;
            return Ref.update(store, (current) => {
              const next = [...current];
              next[index] = updated;
              return next;
            }).pipe(Effect.as(updated));
          }),
        ),

      remove: (id) =>
        Ref.get(store).pipe(
          Effect.flatMap((items) =>
            items.some((t) => t.id === id)
              ? Ref.update(store, (current) => current.filter((t) => t.id !== id))
              : Effect.fail(new TodoNotFound({ id })),
          ),
        ),
    };

    return repo;
  });
