import * as Context from "effect/Context";
import * as Effect from "effect/Effect";
import { CurrentUser } from "../../auth/current-user.ts";
import { TodoRepository } from "../repository/todo.repository.ts";
import { type Todo, type TodoId } from "../schema/todo.schema.model.ts";
import type { CreateTodo, UpdateTodo } from "../schema/todo.schema.requests.ts";

const make = Effect.gen(function* () {
  const repo = yield* TodoRepository;

  return {
    /** The current user's todos — identity comes from context, not the caller. */
    mine: () =>
      Effect.gen(function* () {
        const user = yield* CurrentUser;
        return yield* repo.list({ ownerId: user.id });
      }).pipe(Effect.withSpan("Todos.mine")),

    getById: (id: TodoId) =>
      repo.get(id).pipe(Effect.withSpan("Todos.getById", { attributes: { "todo.id": id } })),

    create: (input: CreateTodo) =>
      Effect.gen(function* () {
        const user = yield* CurrentUser;
        const todo: Todo = {
          id: crypto.randomUUID() as TodoId,
          title: input.title,
          done: false,
          ownerId: user.id,
          createdAt: new Date().toISOString(),
        };
        yield* Effect.logInfo("Creating todo").pipe(
          Effect.annotateLogs({ "user.id": user.id, "todo.title": input.title }),
        );
        return yield* repo.create(todo);
      }).pipe(Effect.withSpan("Todos.create", { attributes: { "todo.title": input.title } })),

    update: (id: TodoId, input: UpdateTodo) =>
      repo.update(id, input).pipe(Effect.withSpan("Todos.update", { attributes: { "todo.id": id } })),

    remove: (id: TodoId) =>
      repo.remove(id).pipe(Effect.withSpan("Todos.remove", { attributes: { "todo.id": id } })),
  };
});

export class Todos extends Context.Service<Todos, Effect.Success<typeof make>>()("Todos", {
  make,
}) {}
