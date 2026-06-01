import * as Layer from "effect/Layer";
import { TodoRepository } from "../repository/todo.repository.ts";
import { makeDbTodoRepository } from "../repository/todo.repository.db.ts";
import { Todos } from "../service/todo.service.ts";

/** Production wiring: Todos service over the Postgres repository. Requires the
 * `Database` service (provided by the Worker). */
export const TodosLive = Layer.effect(Todos, Todos.make).pipe(
  Layer.provide(Layer.effect(TodoRepository, makeDbTodoRepository)),
);
