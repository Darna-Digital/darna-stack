import { Effect } from "effect";
import { FileRepository } from "../repository/file.repository.js";
import { FileStorage } from "../storage/file.storage.js";
import { FileNotFound } from "../schema/file.errors.js";
import { type FileId, type FileMeta, type UploadTicket } from "../schema/file.model.js";

export interface UploadFileInput {
  readonly name: string;
  readonly contentType: string;
  readonly body: Uint8Array;
}

export interface RequestUploadInput {
  readonly name: string;
  readonly contentType: string;
}

export interface FileBytes {
  readonly meta: FileMeta;
  readonly body: Uint8Array;
}

const PRESIGN_EXPIRES_SECONDS = 60 * 60;

export class Files extends Effect.Service<Files>()("Files", {
  accessors: true,
  effect: Effect.gen(function* () {
    const repo = yield* FileRepository;
    const store = yield* FileStorage;

    const list = (): Effect.Effect<readonly FileMeta[]> =>
      repo.list().pipe(Effect.withSpan("Files.list"));

    const getById = (id: FileId): Effect.Effect<FileMeta, FileNotFound> =>
      Effect.gen(function* () {
        const file = yield* repo.findById(id);
        if (!file) return yield* Effect.fail(new FileNotFound({ id }));
        return file;
      }).pipe(Effect.withSpan("Files.getById", { attributes: { "file.id": id } }));

    const download = (id: FileId): Effect.Effect<FileBytes, FileNotFound> =>
      Effect.gen(function* () {
        const meta = yield* repo.findById(id);
        if (!meta) return yield* Effect.fail(new FileNotFound({ id }));
        const body = yield* store.get(id);
        if (!body) return yield* Effect.fail(new FileNotFound({ id }));
        return { meta, body } satisfies FileBytes;
      }).pipe(Effect.withSpan("Files.download", { attributes: { "file.id": id } }));

    const upload = (input: UploadFileInput): Effect.Effect<FileMeta> =>
      Effect.gen(function* () {
        const id = crypto.randomUUID() as FileId;
        yield* store.put({ key: id, body: input.body, contentType: input.contentType });
        const meta = yield* repo
          .create({
            id,
            name: input.name,
            contentType: input.contentType,
            size: input.body.byteLength,
            status: "ready",
          })
          .pipe(
            Effect.tapDefect(() => store.remove(id).pipe(Effect.catchAllDefect(() => Effect.void))),
          );
        return meta;
      }).pipe(Effect.withSpan("Files.upload"));

    const requestUpload = (input: RequestUploadInput): Effect.Effect<UploadTicket> =>
      Effect.gen(function* () {
        const id = crypto.randomUUID() as FileId;
        const meta = yield* repo.create({
          id,
          name: input.name,
          contentType: input.contentType,
          size: 0,
          status: "pending",
        });
        const uploadUrl = yield* store.presignPut({
          key: id,
          contentType: input.contentType,
          expiresInSeconds: PRESIGN_EXPIRES_SECONDS,
        });
        const expiresAt = new Date(Date.now() + PRESIGN_EXPIRES_SECONDS * 1000).toISOString();
        return { meta, uploadUrl, expiresAt } satisfies UploadTicket;
      }).pipe(Effect.withSpan("Files.requestUpload"));

    const finalize = (id: FileId): Effect.Effect<FileMeta, FileNotFound> =>
      Effect.gen(function* () {
        const head = yield* store.head(id);
        if (!head) return yield* Effect.fail(new FileNotFound({ id }));
        const updated = yield* repo.setReady({ id, size: head.size });
        if (!updated) return yield* Effect.fail(new FileNotFound({ id }));
        return updated;
      }).pipe(Effect.withSpan("Files.finalize", { attributes: { "file.id": id } }));

    const rename = (id: FileId, name: string): Effect.Effect<FileMeta, FileNotFound> =>
      Effect.gen(function* () {
        const file = yield* repo.rename(id, name);
        if (!file) return yield* Effect.fail(new FileNotFound({ id }));
        return file;
      }).pipe(Effect.withSpan("Files.rename", { attributes: { "file.id": id } }));

    const remove = (id: FileId): Effect.Effect<void, FileNotFound> =>
      Effect.gen(function* () {
        const removed = yield* repo.remove(id);
        if (!removed) return yield* Effect.fail(new FileNotFound({ id }));
        yield* store.remove(id);
      }).pipe(Effect.withSpan("Files.remove", { attributes: { "file.id": id } }));

    return { list, getById, download, upload, requestUpload, finalize, rename, remove } as const;
  }),
}) {}
