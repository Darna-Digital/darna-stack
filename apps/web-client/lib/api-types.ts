import type { paths } from "./api-schema";

type Json<T> = T extends { content: { "application/json": infer J } } ? J : never;

/** Domain types derived straight from the generated OpenAPI schema. */
export type Project =
  paths["/api/projects/{id}"]["get"]["responses"][200] extends infer R ? Json<R> : never;

export type CreateProjectInput = Json<NonNullable<paths["/api/projects"]["post"]["requestBody"]>>;
export type UpdateProjectInput = Json<
  NonNullable<paths["/api/projects/{id}"]["put"]["requestBody"]>
>;

export type Task =
  paths["/api/tasks/{id}"]["get"]["responses"][200] extends infer R ? Json<R> : never;

export type CreateTaskInput = Json<
  NonNullable<paths["/api/projects/{projectId}/tasks"]["post"]["requestBody"]>
>;
export type UpdateTaskInput = Json<NonNullable<paths["/api/tasks/{id}"]["put"]["requestBody"]>>;
