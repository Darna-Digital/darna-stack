import { describe, expect } from "vitest";
import { it } from "@effect/vitest";
import { Effect, Layer } from "effect";
import { Projects } from "./project.service.ts";
import { ProjectsMemory } from "../layer/project.layer.memory.ts";
import { CurrentUser, type User } from "../../auth/current-user.ts";
import type { Project, ProjectId } from "../schema/project.schema.model.ts";

const mkUser = (id: string, email: string): User => ({
  id,
  email,
  name: email.split("@")[0]!,
  emailVerified: true,
  image: null,
});

const alice = mkUser("user-alice", "alice@example.com");
const bob = mkUser("user-bob", "bob@example.com");

const env = (opts?: { projects?: readonly Project[]; user?: User }) =>
  Layer.mergeAll(
    ProjectsMemory({ seed: opts?.projects ?? [] }),
    Layer.succeed(CurrentUser, opts?.user ?? alice),
  );

const project = (id: string, ownerId: string, name: string): Project => ({
  id: id as ProjectId,
  name,
  ownerId,
  createdAt: "2026-01-01T00:00:00.000Z",
});

describe("Projects.create", () => {
  it.effect("stamps the current user as owner — identity from context", () =>
    Effect.gen(function* () {
      const projects = yield* Projects;
      const created = yield* projects.create({ name: "Website" });
      expect(created.ownerId).toBe(bob.id);
      expect(created.name).toBe("Website");
    }).pipe(Effect.provide(env({ user: bob }))),
  );
});

describe("Projects.mine", () => {
  const seed = [
    project("p-1", alice.id, "Alice 1"),
    project("p-2", alice.id, "Alice 2"),
    project("p-3", bob.id, "Bob 1"),
  ];

  it.effect("returns only the current user's projects", () =>
    Effect.gen(function* () {
      const projects = yield* Projects;
      const mine = yield* projects.mine();
      expect(mine.map((p) => p.id).sort()).toEqual(["p-1", "p-2"]);
    }).pipe(Effect.provide(env({ projects: seed, user: alice }))),
  );
});

describe("Projects.getById / update / remove", () => {
  it.effect("hides another user's project as ProjectNotFound", () =>
    Effect.gen(function* () {
      const projects = yield* Projects;
      const error = yield* Effect.flip(projects.getById("p-3" as ProjectId));
      expect((error as { _tag: string })._tag).toBe("ProjectNotFound");
    }).pipe(Effect.provide(env({ projects: [project("p-3", bob.id, "Bob 1")], user: alice }))),
  );

  it.effect("updates the owner's project name", () =>
    Effect.gen(function* () {
      const projects = yield* Projects;
      const updated = yield* projects.update("p-1" as ProjectId, { name: "Renamed" });
      expect(updated.name).toBe("Renamed");
    }).pipe(Effect.provide(env({ projects: [project("p-1", alice.id, "x")] }))),
  );

  it.effect("removes the owner's project", () =>
    Effect.gen(function* () {
      const projects = yield* Projects;
      yield* projects.remove("p-1" as ProjectId);
      const error = yield* Effect.flip(projects.getById("p-1" as ProjectId));
      expect((error as { _tag: string })._tag).toBe("ProjectNotFound");
    }).pipe(Effect.provide(env({ projects: [project("p-1", alice.id, "x")] }))),
  );
});
