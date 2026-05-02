import { Hono } from "hono"
import { describeRoute, resolver, validator } from "hono-openapi"
import { z } from "zod"
import { runRoute } from "@/lib/effect/api-route.js"
import { Todos } from "./todo.service.js"
import { CreateTodo, Todo, TodoId, UpdateTodo } from "./todo.model.js"

const ErrorResponse = z.object({ error: z.string() })

const ok = (schema: z.ZodTypeAny) => ({
  200: {
    description: "OK",
    content: { "application/json": { schema: resolver(schema) } },
  },
})

const notFound = {
  404: {
    description: "Not Found",
    content: { "application/json": { schema: resolver(ErrorResponse) } },
  },
}

export const todoRoutes = new Hono()
  .get(
    "/",
    describeRoute({
      operationId: "todo.list",
      summary: "List todos",
      responses: ok(z.array(Todo)),
    }),
    (c) => runRoute("GET /todos", c, Todos.list()),
  )
  .post(
    "/",
    describeRoute({
      operationId: "todo.create",
      summary: "Create a todo",
      responses: ok(Todo),
    }),
    validator("json", CreateTodo),
    (c) => runRoute("POST /todos", c, Todos.create(c.req.valid("json"))),
  )
  .get(
    "/:id",
    describeRoute({
      operationId: "todo.get",
      summary: "Get a todo by id",
      responses: { ...ok(Todo), ...notFound },
    }),
    validator("param", z.object({ id: TodoId })),
    (c) => runRoute("GET /todos/:id", c, Todos.getById(c.req.valid("param").id)),
  )
  .patch(
    "/:id",
    describeRoute({
      operationId: "todo.update",
      summary: "Update a todo",
      responses: { ...ok(Todo), ...notFound },
    }),
    validator("param", z.object({ id: TodoId })),
    validator("json", UpdateTodo),
    (c) =>
      runRoute(
        "PATCH /todos/:id",
        c,
        Todos.update(c.req.valid("param").id, c.req.valid("json")),
      ),
  )
  .delete(
    "/:id",
    describeRoute({
      operationId: "todo.remove",
      summary: "Delete a todo",
      responses: { 204: { description: "No Content" }, ...notFound },
    }),
    validator("param", z.object({ id: TodoId })),
    (c) => runRoute("DELETE /todos/:id", c, Todos.remove(c.req.valid("param").id)),
  )
