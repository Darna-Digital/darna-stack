import type { paths } from "./api-schema";

type Json<T> = T extends { content: { "application/json": infer J } } ? J : never;

/** Domain types derived straight from the generated OpenAPI schema. */
export type Todo =
  paths["/api/todos/{id}"]["get"]["responses"][200] extends infer R ? Json<R> : never;

export type CreateTodoInput = Json<NonNullable<paths["/api/todos"]["post"]["requestBody"]>>;
export type UpdateTodoInput = Json<NonNullable<paths["/api/todos/{id}"]["put"]["requestBody"]>>;
