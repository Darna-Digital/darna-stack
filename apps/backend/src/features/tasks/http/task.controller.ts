import * as Effect from "effect/Effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { Api } from "../../../api.ts";
import { Tasks } from "../service/task.service.ts";

export const TasksController = HttpApiBuilder.group(Api, "tasks", (handlers) =>
  handlers
    .handle("show", ({ params }) => Effect.flatMap(Tasks, (s) => s.getById(params.id)))
    .handle("update", ({ params, payload }) =>
      Effect.flatMap(Tasks, (s) => s.update(params.id, payload)),
    )
    .handle("destroy", ({ params }) => Effect.flatMap(Tasks, (s) => s.remove(params.id))),
);
