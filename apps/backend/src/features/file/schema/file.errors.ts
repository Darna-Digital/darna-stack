import { HttpApiSchema } from "@effect/platform";
import { Schema } from "effect";
import { FileId } from "./file.model.js";

export class FileNotFound extends Schema.TaggedError<FileNotFound>()(
  "FileNotFound",
  { id: FileId },
  HttpApiSchema.annotations({ status: 404 }),
) {}
