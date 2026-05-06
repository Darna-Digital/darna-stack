import { Layer } from "effect";
import { TodoRepository } from "../repository/todo.repository.js";
import { createMemoryTodoRepo } from "../repository/todo.repository.memory.js";
import { createDbTodoRepo } from "../repository/todo.repository.db.js";
import { Todos } from "../service/todo.service.js";
import type { Todo } from "../schema/todo.model.js";

export const TodosMemory = (seed: readonly Todo[] = []) =>
  Todos.Default.pipe(Layer.provide(Layer.effect(TodoRepository, createMemoryTodoRepo(seed))));

export const TodosLive = Todos.Default.pipe(
  Layer.provide(Layer.succeed(TodoRepository, createDbTodoRepo)),
);
