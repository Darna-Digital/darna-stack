import * as Effect from "effect/Effect";
import * as Ref from "effect/Ref";
import { TaskNotFound, type Task } from "../schema/task.schema.model.ts";
import type { TaskRepo } from "./task.repository.ts";

/** In-memory repository for unit tests — no database required. */
export const makeMemoryTaskRepository = (seed: readonly Task[] = []) =>
  Effect.gen(function* () {
    const store = yield* Ref.make<Task[]>([...seed]);

    const repo: TaskRepo = {
      list: (filter = {}) =>
        Ref.get(store).pipe(
          Effect.map((items) =>
            items.filter((t) => !filter.projectId || t.projectId === filter.projectId),
          ),
        ),

      get: (id) =>
        Ref.get(store).pipe(
          Effect.flatMap((items) => {
            const found = items.find((t) => t.id === id);
            return found ? Effect.succeed(found) : Effect.fail(new TaskNotFound({ id }));
          }),
        ),

      create: (task) => Ref.update(store, (items) => [...items, task]).pipe(Effect.as(task)),

      update: (id, patch) =>
        Ref.get(store).pipe(
          Effect.flatMap((items) => {
            const index = items.findIndex((t) => t.id === id);
            if (index === -1) return Effect.fail(new TaskNotFound({ id }));
            const updated = { ...items[index], ...patch } as Task;
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
              : Effect.fail(new TaskNotFound({ id })),
          ),
        ),
    };

    return repo;
  });
