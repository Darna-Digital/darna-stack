import { HttpApiBuilder } from "@effect/platform";
import { Effect, Layer } from "effect";
import { Api } from "../../../api.js";
import { FilesLive } from "../layer/file.layer.js";
import { Files } from "../service/file.service.js";

const FileHandlersLive = HttpApiBuilder.group(Api, "file", (handlers) =>
  handlers
    .handle("list", () => Files.list().pipe(Effect.map((arr) => [...arr])))
    .handle("get", ({ path }) => Files.getById(path.id))
    .handle("download", ({ path }) =>
      Files.download(path.id).pipe(Effect.map((bytes) => bytes.body)),
    )
    .handle("upload", ({ headers, payload }) =>
      Files.upload({
        name: headers["x-file-name"],
        contentType: headers["content-type"] ?? "application/octet-stream",
        body: payload,
      }),
    )
    .handle("requestUpload", ({ payload }) => Files.requestUpload(payload))
    .handle("finalize", ({ path }) => Files.finalize(path.id))
    .handle("rename", ({ path, payload }) => Files.rename(path.id, payload.name))
    .handle("remove", ({ path }) => Files.remove(path.id)),
);

export const FileHandlers = FileHandlersLive.pipe(Layer.provide(FilesLive));
