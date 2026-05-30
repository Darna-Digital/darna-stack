import { HttpApiEndpoint, HttpApiGroup, HttpApiSchema } from "@effect/platform";
import { Schema } from "effect";
import { FileNotFound } from "../schema/file.errors.js";
import { FileId, FileMeta, RenameFile, RequestUpload, UploadTicket } from "../schema/file.model.js";

const IdParam = Schema.Struct({ id: FileId });

const UploadHeaders = Schema.Struct({
  "x-file-name": Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255)),
  "content-type": Schema.optional(Schema.String),
});

const FileBytes = HttpApiSchema.Uint8Array();

export class FileApi extends HttpApiGroup.make("file")
  .add(HttpApiEndpoint.get("list", "/files").addSuccess(Schema.Array(FileMeta)))
  .add(
    HttpApiEndpoint.get("get", "/files/:id")
      .setPath(IdParam)
      .addSuccess(FileMeta)
      .addError(FileNotFound),
  )
  .add(
    HttpApiEndpoint.get("download", "/files/:id/content")
      .setPath(IdParam)
      .addSuccess(FileBytes)
      .addError(FileNotFound),
  )
  .add(
    HttpApiEndpoint.post("upload", "/files")
      .setHeaders(UploadHeaders)
      .setPayload(FileBytes)
      .addSuccess(FileMeta, { status: 201 }),
  )
  .add(
    HttpApiEndpoint.post("requestUpload", "/files/upload-url")
      .setPayload(RequestUpload)
      .addSuccess(UploadTicket, { status: 201 }),
  )
  .add(
    HttpApiEndpoint.post("finalize", "/files/:id/finalize")
      .setPath(IdParam)
      .addSuccess(FileMeta)
      .addError(FileNotFound),
  )
  .add(
    HttpApiEndpoint.patch("rename", "/files/:id")
      .setPath(IdParam)
      .setPayload(RenameFile)
      .addSuccess(FileMeta)
      .addError(FileNotFound),
  )
  .add(
    HttpApiEndpoint.del("remove", "/files/:id")
      .setPath(IdParam)
      .addSuccess(Schema.Void, { status: 204 })
      .addError(FileNotFound),
  ) {}
