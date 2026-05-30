import { Schema } from "effect";

export const FileId = Schema.UUID.pipe(Schema.brand("FileId"));
export type FileId = typeof FileId.Type;

export const FileStatus = Schema.Literal("pending", "ready");
export type FileStatus = typeof FileStatus.Type;

export const FileMeta = Schema.Struct({
  id: FileId,
  name: Schema.String,
  contentType: Schema.String,
  size: Schema.Number,
  status: FileStatus,
  uploadedAt: Schema.String,
});
export type FileMeta = typeof FileMeta.Type;

export const RenameFile = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255)),
});
export type RenameFile = typeof RenameFile.Type;

export const RequestUpload = Schema.Struct({
  name: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255)),
  contentType: Schema.String.pipe(Schema.minLength(1), Schema.maxLength(255)),
});
export type RequestUpload = typeof RequestUpload.Type;

export const UploadTicket = Schema.Struct({
  meta: FileMeta,
  uploadUrl: Schema.String,
  expiresAt: Schema.String,
});
export type UploadTicket = typeof UploadTicket.Type;
