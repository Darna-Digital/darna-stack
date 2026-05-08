import { describe, expect, it } from "vitest";
import { Effect, Either } from "effect";
import { FilesMemory, type MemorySeed } from "../layer/file.layer.js";
import { Files } from "./file.service.js";
import type { FileId, FileMeta } from "../schema/file.model.js";

const run = <Success, Failure>(
  effect: Effect.Effect<Success, Failure, Files>,
  options?: { seed?: MemorySeed },
) => Effect.runPromise(effect.pipe(Effect.either, Effect.provide(FilesMemory(options?.seed))));

const seedMeta: FileMeta = {
  id: "11111111-1111-4111-8111-111111111111" as FileId,
  name: "seed.txt",
  contentType: "text/plain",
  size: 4,
  status: "ready",
  uploadedAt: "2026-01-01T00:00:00.000Z",
};
const seedFile: MemorySeed = {
  meta: [seedMeta],
  bytes: [{ key: seedMeta.id, body: new Uint8Array([1, 2, 3, 4]) }],
};

describe("Files.upload", () => {
  it("stores a new file with a generated id, ready status, and reported size", async () => {
    const result = await run(
      Files.upload({
        name: "hello.txt",
        contentType: "text/plain",
        body: new Uint8Array([72, 105]),
      }),
    );
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right.name).toBe("hello.txt");
      expect(result.right.size).toBe(2);
      expect(result.right.status).toBe("ready");
      expect(result.right.id).toMatch(/^[0-9a-f-]{36}$/);
    }
  });
});

describe("Files.requestUpload", () => {
  it("creates a pending row with size=0 and returns an upload url", async () => {
    const result = await run(
      Files.requestUpload({ name: "big.bin", contentType: "application/octet-stream" }),
    );
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right.meta.status).toBe("pending");
      expect(result.right.meta.size).toBe(0);
      expect(result.right.uploadUrl).toContain(result.right.meta.id);
      expect(result.right.expiresAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    }
  });
});

describe("Files.finalize", () => {
  it("flips a pending row to ready and pulls size from storage", async () => {
    const pendingMeta: FileMeta = { ...seedMeta, size: 0, status: "pending" };
    const result = await run(Files.finalize(pendingMeta.id), {
      seed: {
        meta: [pendingMeta],
        bytes: [{ key: pendingMeta.id, body: new Uint8Array([9, 9, 9]) }],
      },
    });
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) {
      expect(result.right.status).toBe("ready");
      expect(result.right.size).toBe(3);
    }
  });

  it("fails with FileNotFound when the bytes were never uploaded", async () => {
    const pendingMeta: FileMeta = { ...seedMeta, size: 0, status: "pending" };
    const result = await run(Files.finalize(pendingMeta.id), {
      seed: { meta: [pendingMeta], bytes: [] },
    });
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) expect(result.left._tag).toBe("FileNotFound");
  });
});

describe("Files.getById", () => {
  it("returns metadata when the file exists", async () => {
    const result = await run(Files.getById(seedMeta.id), { seed: seedFile });
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) expect(result.right.name).toBe("seed.txt");
  });

  it("fails with FileNotFound when the id is unknown", async () => {
    const missing = "00000000-0000-4000-8000-000000000000" as FileId;
    const result = await run(Files.getById(missing));
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result) && result.left._tag === "FileNotFound") {
      expect(result.left.id).toBe(missing);
    }
  });
});

describe("Files.download", () => {
  it("returns bytes for an existing file", async () => {
    const result = await run(Files.download(seedMeta.id), { seed: seedFile });
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) expect(Array.from(result.right.body)).toEqual([1, 2, 3, 4]);
  });
});

describe("Files.rename", () => {
  it("updates the display name", async () => {
    const result = await run(Files.rename(seedMeta.id, "renamed.txt"), { seed: seedFile });
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) expect(result.right.name).toBe("renamed.txt");
  });

  it("fails with FileNotFound for an unknown id", async () => {
    const result = await run(Files.rename("99999999-9999-4999-8999-999999999999" as FileId, "x"));
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) expect(result.left._tag).toBe("FileNotFound");
  });
});

describe("Files.remove", () => {
  it("removes an existing file", async () => {
    const result = await run(
      Effect.gen(function* () {
        yield* Files.remove(seedMeta.id);
        return yield* Files.list();
      }),
      { seed: seedFile },
    );
    expect(Either.isRight(result)).toBe(true);
    if (Either.isRight(result)) expect(result.right).toHaveLength(0);
  });

  it("fails with FileNotFound when the id is unknown", async () => {
    const result = await run(Files.remove("88888888-8888-4888-8888-888888888888" as FileId));
    expect(Either.isLeft(result)).toBe(true);
    if (Either.isLeft(result)) expect(result.left._tag).toBe("FileNotFound");
  });
});
