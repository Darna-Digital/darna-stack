import { Context, Effect } from "effect";
import type { FileId } from "../schema/file.model.js";

export interface PutInput {
  readonly key: FileId;
  readonly body: Uint8Array;
  readonly contentType: string;
}

export interface PresignPutInput {
  readonly key: FileId;
  readonly contentType: string;
  readonly expiresInSeconds: number;
}

export interface HeadResult {
  readonly size: number;
}

export interface FileStore {
  readonly put: (input: PutInput) => Effect.Effect<void>;
  readonly get: (key: FileId) => Effect.Effect<Uint8Array | undefined>;
  readonly head: (key: FileId) => Effect.Effect<HeadResult | undefined>;
  readonly presignPut: (input: PresignPutInput) => Effect.Effect<string>;
  readonly remove: (key: FileId) => Effect.Effect<void>;
}

export class FileStorage extends Context.Tag("FileStorage")<FileStorage, FileStore>() {}
