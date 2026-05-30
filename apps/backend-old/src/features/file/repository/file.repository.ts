import { Context, Effect } from "effect";
import type { FileId, FileMeta, FileStatus } from "../schema/file.model.js";

export interface CreateFileMeta {
  readonly id: FileId;
  readonly name: string;
  readonly contentType: string;
  readonly size: number;
  readonly status: FileStatus;
}

export interface SetReadyInput {
  readonly id: FileId;
  readonly size: number;
}

export interface FileRepo {
  readonly list: () => Effect.Effect<readonly FileMeta[]>;
  readonly findById: (id: FileId) => Effect.Effect<FileMeta | undefined>;
  readonly create: (input: CreateFileMeta) => Effect.Effect<FileMeta>;
  readonly setReady: (input: SetReadyInput) => Effect.Effect<FileMeta | undefined>;
  readonly rename: (id: FileId, name: string) => Effect.Effect<FileMeta | undefined>;
  readonly remove: (id: FileId) => Effect.Effect<boolean>;
}

export class FileRepository extends Context.Tag("FileRepository")<FileRepository, FileRepo>() {}
