import { FileList } from "./file-list";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Files",
};

export default function FilesPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Files</h1>

      <p className="mt-1 text-sm text-zinc-500">Upload and manage files in R2.</p>

      <FileList />
    </main>
  );
}
