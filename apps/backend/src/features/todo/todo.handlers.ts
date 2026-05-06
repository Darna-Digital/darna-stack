import { HttpApiBuilder } from "@effect/platform"
import { Effect } from "effect"
import { Api } from "../../api.js"
import { Todos } from "./todo.service.js"

const onStorageError = (e: { readonly cause: unknown }) =>
  Effect.logError("Storage error", e.cause).pipe(Effect.zipRight(Effect.die(e)))

export const TodoHandlers = HttpApiBuilder.group(Api, "todo", (handlers) =>
  handlers
    .handle("list", () =>
      Todos.list().pipe(
        Effect.map((arr) => [...arr]),
        Effect.catchTag("StorageError", onStorageError),
      ),
    )
    .handle("get", ({ path }) =>
      Todos.getById(path.id).pipe(Effect.catchTag("StorageError", onStorageError)),
    )
    .handle("create", ({ payload }) =>
      Todos.create(payload).pipe(Effect.catchTag("StorageError", onStorageError)),
    )
    .handle("update", ({ path, payload }) =>
      Todos.update(path.id, payload).pipe(
        Effect.catchTag("StorageError", onStorageError),
      ),
    )
    .handle("remove", ({ path }) =>
      Todos.remove(path.id).pipe(Effect.catchTag("StorageError", onStorageError)),
    ),
)
