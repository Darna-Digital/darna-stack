import * as Effect from "effect/Effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { Api } from "../../../api.ts";
import { Tasks } from "../service/task.service.ts";

export const ProjectTasksController = HttpApiBuilder.group(Api, "projectTasks", (handlers) =>
  handlers
    .handle("index", ({ params }) =>
      Effect.flatMap(Tasks, (s) => s.listForProject(params.projectId)),
    )
    .handle("store", ({ params, payload }) =>
      Effect.flatMap(Tasks, (s) => s.create(params.projectId, payload)),
    ),
);
