"use client";

import { useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { $api } from "@/lib/api";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const RenameFile = z.object({
  name: z.string().trim().min(1, "Required").max(255),
});
type RenameFileInput = z.infer<typeof RenameFile>;

const formatSize = (bytes: number) => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export function FileList() {
  const qc = useQueryClient();
  const invalidateList = () => qc.invalidateQueries({ queryKey: ["get", "/api/files"] });

  const { data: files } = $api.useQuery("get", "/api/files");

  const remove = $api.useMutation("delete", "/api/files/{id}", {
    onSuccess: invalidateList,
  });

  const requestUpload = $api.useMutation("post", "/api/files/upload-url");
  const finalize = $api.useMutation("post", "/api/files/{id}/finalize");

  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | undefined>();

  const onUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(undefined);
    try {
      const contentType = file.type || "application/octet-stream";
      const ticket = await requestUpload.mutateAsync({
        body: { name: file.name, contentType },
      });
      const putRes = await fetch(ticket.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });
      if (!putRes.ok) throw new Error(`R2 upload failed (${putRes.status})`);
      await finalize.mutateAsync({ params: { path: { id: ticket.meta.id } } });
      invalidateList();
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="mt-8 space-y-6">
      <div className="space-y-2">
        <input
          ref={inputRef}
          type="file"
          onChange={onUpload}
          disabled={uploading}
          className="block w-full text-sm file:mr-3 file:rounded-md file:border-0 file:bg-zinc-900 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-zinc-700 disabled:opacity-50 dark:file:bg-zinc-100 dark:file:text-zinc-900"
        />
        {uploading ? <p className="text-xs text-zinc-500">Uploading…</p> : null}
        {uploadError ? <p className="text-xs text-red-600">{uploadError}</p> : null}
      </div>

      {files?.length === 0 ? (
        <p className="text-sm text-zinc-500">No files yet.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {files?.map((f) => (
            <FileRow
              key={f.id}
              file={f}
              onRename={invalidateList}
              onDelete={() => remove.mutate({ params: { path: { id: f.id } } })}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

interface FileRowProps {
  file: {
    id: string;
    name: string;
    contentType: string;
    size: number;
    status: "pending" | "ready";
    uploadedAt: string;
  };
  onRename: () => void;
  onDelete: () => void;
}

function FileRow({ file, onRename, onDelete }: FileRowProps) {
  const [editing, setEditing] = useState(false);

  const rename = $api.useMutation("patch", "/api/files/{id}", {
    onSuccess: () => {
      onRename();
      setEditing(false);
    },
  });

  const form = useForm<RenameFileInput>({
    resolver: zodResolver(RenameFile),
    defaultValues: { name: file.name },
  });

  const onSubmit = form.handleSubmit(async (input) => {
    await rename.mutateAsync({ params: { path: { id: file.id } }, body: input });
  });

  const nameError = form.formState.errors.name?.message;

  return (
    <li className="flex items-center gap-3 py-3 text-sm">
      {editing ? (
        <form className="flex flex-1 items-center gap-2" onSubmit={onSubmit}>
          <input
            type="text"
            aria-invalid={nameError ? "true" : "false"}
            {...form.register("name")}
            className="flex-1 rounded-md border border-zinc-300 bg-white px-2 py-1 text-sm outline-none focus:border-zinc-500 aria-[invalid=true]:border-red-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="rounded-md bg-zinc-900 px-3 py-1 text-xs font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Save
          </button>
          <button
            type="button"
            onClick={() => {
              form.reset({ name: file.name });
              setEditing(false);
            }}
            className="text-xs text-zinc-500 hover:underline"
          >
            cancel
          </button>
        </form>
      ) : (
        <>
          {file.status === "ready" ? (
            <a
              href={`${baseUrl}/api/files/${file.id}/content`}
              target="_blank"
              rel="noopener"
              className="flex-1 truncate hover:underline"
            >
              {file.name}
            </a>
          ) : (
            <span className="flex-1 truncate text-zinc-400">{file.name}</span>
          )}
          <span className="text-xs text-zinc-500">
            {file.status === "ready" ? formatSize(file.size) : "pending"}
          </span>
          <button
            type="button"
            onClick={() => setEditing(true)}
            className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
          >
            rename
          </button>
          <button
            type="button"
            onClick={onDelete}
            className="text-xs text-zinc-500 hover:text-red-600"
          >
            delete
          </button>
        </>
      )}
    </li>
  );
}
