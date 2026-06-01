import { describe, expect } from "vitest";
import { it } from "@effect/vitest";
import { Effect, Layer, Ref } from "effect";
import { Tasks } from "./task.service.ts";
import { TasksMemory } from "../layer/task.layer.memory.ts";
import { TaskNotifier } from "../workflow/task-notification.workflow.ts";
import { CurrentUser, type User } from "../../auth/current-user.ts";
import type { Project, ProjectId } from "../../projects/schema/project.schema.model.ts";
import type { Task, TaskId } from "../schema/task.schema.model.ts";

const mkUser = (id: string, email: string): User => ({
  id,
  email,
  name: email.split("@")[0]!,
  emailVerified: true,
  image: null,
});

const alice = mkUser("user-alice", "alice@example.com");
const bob = mkUser("user-bob", "bob@example.com");

const project = (id: string, ownerId: string): Project => ({
  id: id as ProjectId,
  name: `${ownerId}'s project`,
  ownerId,
  createdAt: "2026-01-01T00:00:00.000Z",
});

const task = (id: string, projectId: string, title: string, done = false): Task => ({
  id: id as TaskId,
  title,
  done,
  projectId,
  createdAt: "2026-01-01T00:00:00.000Z",
});

const projects = [project("p-alice", alice.id), project("p-bob", bob.id)];

const env = (opts?: {
  tasks?: readonly Task[];
  user?: User;
  notifier?: Layer.Layer<TaskNotifier>;
}) =>
  Layer.mergeAll(
    TasksMemory({ projects, tasks: opts?.tasks ?? [], notifier: opts?.notifier }),
    Layer.succeed(CurrentUser, opts?.user ?? alice),
  );

const tag = (e: unknown) => (e as { _tag: string })._tag;

describe("Tasks.listForProject", () => {
  const seed = [
    task("t-1", "p-alice", "Alice task 1"),
    task("t-2", "p-alice", "Alice task 2"),
    task("t-3", "p-bob", "Bob task"),
  ];

  it.effect("lists tasks of a project the user owns", () =>
    Effect.gen(function* () {
      const tasks = yield* Tasks;
      const list = yield* tasks.listForProject("p-alice" as ProjectId);
      expect(list.map((t) => t.id).sort()).toEqual(["t-1", "t-2"]);
    }).pipe(Effect.provide(env({ tasks: seed, user: alice }))),
  );

  it.effect("hides another user's project as ProjectNotFound", () =>
    Effect.gen(function* () {
      const tasks = yield* Tasks;
      const error = yield* Effect.flip(tasks.listForProject("p-bob" as ProjectId));
      expect(tag(error)).toBe("ProjectNotFound");
    }).pipe(Effect.provide(env({ tasks: seed, user: alice }))),
  );
});

describe("Tasks.create", () => {
  it.effect("creates a task inside an owned project", () =>
    Effect.gen(function* () {
      const tasks = yield* Tasks;
      const created = yield* tasks.create("p-alice" as ProjectId, { title: "Buy milk" });
      expect(created.projectId).toBe("p-alice");
      expect(created.done).toBe(false);
    }).pipe(Effect.provide(env({ user: alice }))),
  );

  it.effect("refuses to create in another user's project", () =>
    Effect.gen(function* () {
      const tasks = yield* Tasks;
      const error = yield* Effect.flip(tasks.create("p-bob" as ProjectId, { title: "nope" }));
      expect(tag(error)).toBe("ProjectNotFound");
    }).pipe(Effect.provide(env({ user: alice }))),
  );
});

describe("Tasks.create notifies the owner", () => {
  const recorder = () =>
    Effect.gen(function* () {
      const calls = yield* Ref.make<ReadonlyArray<{ task: Task; owner: User }>>([]);
      const layer = Layer.succeed(TaskNotifier, {
        taskCreated: (task: Task, owner: User) => Ref.update(calls, (c) => [...c, { task, owner }]),
      });
      return { calls, layer };
    });

  it.effect("triggers the notifier with the created task and current user", () =>
    Effect.gen(function* () {
      const { calls, layer } = yield* recorder();
      const created = yield* Effect.gen(function* () {
        const tasks = yield* Tasks;
        return yield* tasks.create("p-alice" as ProjectId, { title: "Buy milk" });
      }).pipe(Effect.provide(env({ user: alice, notifier: layer })));

      const recorded = yield* Ref.get(calls);
      expect(recorded).toHaveLength(1);
      expect(recorded[0]!.task.id).toBe(created.id);
      expect(recorded[0]!.task.title).toBe("Buy milk");
      expect(recorded[0]!.owner.id).toBe(alice.id);
    }),
  );

  it.effect("does not notify when creation is refused", () =>
    Effect.gen(function* () {
      const { calls, layer } = yield* recorder();
      const error = yield* Effect.gen(function* () {
        const tasks = yield* Tasks;
        return yield* Effect.flip(tasks.create("p-bob" as ProjectId, { title: "nope" }));
      }).pipe(Effect.provide(env({ user: alice, notifier: layer })));

      expect(tag(error)).toBe("ProjectNotFound");
      expect(yield* Ref.get(calls)).toHaveLength(0);
    }),
  );
});

describe("Tasks.getById / update / remove authorize through the project", () => {
  const seed = [task("t-1", "p-alice", "Alice task"), task("t-3", "p-bob", "Bob task")];

  it.effect("updates the owner's task", () =>
    Effect.gen(function* () {
      const tasks = yield* Tasks;
      const updated = yield* tasks.update("t-1" as TaskId, { done: true });
      expect(updated.done).toBe(true);
    }).pipe(Effect.provide(env({ tasks: seed, user: alice }))),
  );

  it.effect("hides a task in another user's project as TaskNotFound", () =>
    Effect.gen(function* () {
      const tasks = yield* Tasks;
      const error = yield* Effect.flip(tasks.getById("t-3" as TaskId));
      expect(tag(error)).toBe("TaskNotFound");
    }).pipe(Effect.provide(env({ tasks: seed, user: alice }))),
  );

  it.effect("refuses to remove a task in another user's project", () =>
    Effect.gen(function* () {
      const tasks = yield* Tasks;
      const error = yield* Effect.flip(tasks.remove("t-3" as TaskId));
      expect(tag(error)).toBe("TaskNotFound");
    }).pipe(Effect.provide(env({ tasks: seed, user: alice }))),
  );

  it.effect("removes the owner's task", () =>
    Effect.gen(function* () {
      const tasks = yield* Tasks;
      yield* tasks.remove("t-1" as TaskId);
      const error = yield* Effect.flip(tasks.getById("t-1" as TaskId));
      expect(tag(error)).toBe("TaskNotFound");
    }).pipe(Effect.provide(env({ tasks: seed, user: alice }))),
  );
});
