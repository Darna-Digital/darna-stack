import { HttpApiEndpoint, HttpApiGroup } from "@effect/platform"
import { Schema } from "effect"
import { Todo } from "../../todo/schema/todo.model.js"
import { ProjectNotFound } from "../schema/project.errors.js"
import {
  CreateProject,
  Project,
  ProjectId,
  UpdateProject,
} from "../schema/project.model.js"

const IdParam = Schema.Struct({ id: ProjectId })

export class ProjectApi extends HttpApiGroup.make("project")
  .add(
    HttpApiEndpoint.get("list", "/projects").addSuccess(Schema.Array(Project)),
  )
  .add(
    HttpApiEndpoint.get("get", "/projects/:id")
      .setPath(IdParam)
      .addSuccess(Project)
      .addError(ProjectNotFound),
  )
  .add(
    HttpApiEndpoint.post("create", "/projects")
      .setPayload(CreateProject)
      .addSuccess(Project, { status: 201 }),
  )
  .add(
    HttpApiEndpoint.patch("update", "/projects/:id")
      .setPath(IdParam)
      .setPayload(UpdateProject)
      .addSuccess(Project)
      .addError(ProjectNotFound),
  )
  .add(
    HttpApiEndpoint.del("remove", "/projects/:id")
      .setPath(IdParam)
      .addSuccess(Schema.Void, { status: 204 })
      .addError(ProjectNotFound),
  )
  .add(
    HttpApiEndpoint.get("listTodos", "/projects/:id/todos")
      .setPath(IdParam)
      .addSuccess(Schema.Array(Todo))
      .addError(ProjectNotFound),
  ) {}
