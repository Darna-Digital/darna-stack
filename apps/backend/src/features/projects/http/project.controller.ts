import * as Effect from "effect/Effect";
import { HttpApiBuilder } from "effect/unstable/httpapi";
import { Api } from "../../../api.ts";
import { Projects } from "../service/project.service.ts";

export const ProjectsController = HttpApiBuilder.group(Api, "projects", (handlers) =>
  handlers
    .handle("index", () => Effect.flatMap(Projects, (s) => s.mine()))
    .handle("store", ({ payload }) => Effect.flatMap(Projects, (s) => s.create(payload)))
    .handle("show", ({ params }) => Effect.flatMap(Projects, (s) => s.getById(params.id)))
    .handle("update", ({ params, payload }) =>
      Effect.flatMap(Projects, (s) => s.update(params.id, payload)),
    )
    .handle("destroy", ({ params }) => Effect.flatMap(Projects, (s) => s.remove(params.id))),
);
