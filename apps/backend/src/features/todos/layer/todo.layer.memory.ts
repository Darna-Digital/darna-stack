import * as Layer from "effect/Layer";
import type { Todo } from "../schema/todo.schema.model.ts";
import { TodoRepository } from "../repository/todo.repository.ts";
import { makeMemoryTodoRepository } from "../repository/todo.repository.memory.ts";
import { Todos } from "../service/todo.service.ts";

/** Test wiring: Todos service over an in-memory repository. No DB required. */
export const TodosMemory = ({ seed = [] }: { seed?: readonly Todo[] } = {}) =>
  Layer.effect(Todos, Todos.make).pipe(
    Layer.provide(Layer.effect(TodoRepository, makeMemoryTodoRepository(seed))),
  );
