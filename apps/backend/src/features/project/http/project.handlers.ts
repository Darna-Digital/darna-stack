import { HttpApiBuilder } from "@effect/platform"
import { Effect, Layer } from "effect"
import { Api } from "../../../api.js"
import { TodosLive } from "../../todo/layer/todo.layer.js"
import { Todos } from "../../todo/service/todo.service.js"
import { ProjectsLive } from "../layer/project.layer.js"
import { Projects } from "../service/project.service.js"

const ProjectHandlersLive = HttpApiBuilder.group(Api, "project", (handlers) =>
  handlers
    .handle("list", () =>
      Projects.list().pipe(Effect.map((arr) => [...arr])),
    )
    .handle("get", ({ path }) => Projects.getById(path.id))
    .handle("create", ({ payload }) => Projects.create(payload))
    .handle("update", ({ path, payload }) => Projects.update(path.id, payload))
    .handle("remove", ({ path }) => Projects.remove(path.id))
    .handle("listTodos", ({ path }) =>
      Effect.gen(function* () {
        yield* Projects.getById(path.id)
        const todos = yield* Todos.listByProject(path.id)
        return [...todos]
      }),
    ),
)

export const ProjectHandlers = ProjectHandlersLive.pipe(
  Layer.provide([ProjectsLive, TodosLive]),
)
