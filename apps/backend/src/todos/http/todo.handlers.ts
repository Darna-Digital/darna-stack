import * as Effect from "effect/Effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { Api } from "../../api.ts";
import { Todos } from "../service/todo.service.ts";

export const TodoHandlers = HttpApiBuilder.group(Api, "todos", (handlers) =>
  handlers
    .handle("list", () => Effect.flatMap(Todos, (s) => s.mine()))
    .handle("create", ({ payload }) => Effect.flatMap(Todos, (s) => s.create(payload)))
    .handle("getById", ({ params }) => Effect.flatMap(Todos, (s) => s.getById(params.id)))
    .handle("update", ({ params, payload }) =>
      Effect.flatMap(Todos, (s) => s.update(params.id, payload)),
    )
    .handle("remove", ({ params }) => Effect.flatMap(Todos, (s) => s.remove(params.id))),
);
