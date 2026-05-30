import { describe, expect, it } from "vitest";
import { Effect, Either } from "effect";
import { ProjectsMemory } from "../layer/project.layer.js";
import { Projects } from "./project.service.js";
import type { Project, ProjectId } from "../schema/project.model.js";

const run = <Success, Failure>(
  effect: Effect.Effect<Success, Failure, Projects>,
  options?: { seed?: readonly Project[] },
) => Effect.runPromise(effect.pipe(Effect.either, Effect.provide(ProjectsMemory(options?.seed))));

const seedProject: Project = {
  id: "22222222-2222-4222-8222-222222222222" as ProjectId,
  name: "seed",
  createdAt: "2026-01-01T00:00:00.000Z",
};

describe("Projects.create", () => {
  it("stores a new project with a generated id", async () => {
    const result = await run(Projects.create({ name: "home renovation" }));
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right.name).toBe("home renovation");
      expect(result.right.id).toMatch(/^[0-9a-f-]{36}$/);
    }
  });

  it("appends to the seed", async () => {
    const result = await run(
      Effect.gen(function* () {
        yield* Projects.create({ name: "second" });
        return yield* Projects.list();
      }),
      { seed: [seedProject] },
    );
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right).toHaveLength(2);
      expect(result.right.map((p) => p.name)).toContain("second");
    }
  });
});

describe("Projects.getById", () => {
  it("returns the project when it exists", async () => {
    const result = await run(Projects.getById(seedProject.id), {
      seed: [seedProject],
    });
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) expect(result.right.name).toBe("seed");
  });

  it("fails with ProjectNotFound when the id is unknown", async () => {
    const missing = "00000000-0000-4000-8000-000000000000" as ProjectId;
    const result = await run(Projects.getById(missing));
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result) && result.left._tag === "ProjectNotFound") {
      expect(result.left.id).toBe(missing);
    }
  });
});

describe("Projects.update", () => {
  it("merges patch fields", async () => {
    const result = await run(Projects.update(seedProject.id, { name: "renamed" }), {
      seed: [seedProject],
    });
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) expect(result.right.name).toBe("renamed");
  });

  it("fails with ProjectNotFound for an unknown id", async () => {
    const result = await run(
      Projects.update("99999999-9999-4999-8999-999999999999" as ProjectId, {
        name: "x",
      }),
    );
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) expect(result.left._tag).toBe("ProjectNotFound");
  });
});

describe("Projects.remove", () => {
  it("removes an existing project", async () => {
    const result = await run(
      Effect.gen(function* () {
        yield* Projects.remove(seedProject.id);
        return yield* Projects.list();
      }),
      { seed: [seedProject] },
    );
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) expect(result.right).toHaveLength(0);
  });

  it("fails with ProjectNotFound when the id is unknown", async () => {
    const result = await run(Projects.remove("88888888-8888-4888-8888-888888888888" as ProjectId));
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) expect(result.left._tag).toBe("ProjectNotFound");
  });
});
