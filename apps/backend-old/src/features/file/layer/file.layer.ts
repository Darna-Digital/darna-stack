import { Layer } from "effect";
import { FileRepository } from "../repository/file.repository.js";
import { createDbFileRepo } from "../repository/file.repository.db.js";
import { createMemoryFileRepo } from "../repository/file.repository.memory.js";
import { FileStorage } from "../storage/file.storage.js";
import { createR2FileStore } from "../storage/file.storage.r2.js";
import { createMemoryFileStore } from "../storage/file.storage.memory.js";
import { Files } from "../service/file.service.js";
import type { FileId, FileMeta } from "../schema/file.model.js";

export interface MemorySeed {
  readonly meta?: readonly FileMeta[];
  readonly bytes?: readonly { key: FileId; body: Uint8Array }[];
}

export const FilesMemory = (seed: MemorySeed = {}) =>
  Files.Default.pipe(
    Layer.provide(Layer.effect(FileRepository, createMemoryFileRepo(seed.meta ?? []))),
    Layer.provide(Layer.effect(FileStorage, createMemoryFileStore(seed.bytes ?? []))),
  );

export const FilesLive = Files.Default.pipe(
  Layer.provide(Layer.succeed(FileRepository, createDbFileRepo)),
  Layer.provide(Layer.succeed(FileStorage, createR2FileStore)),
);
