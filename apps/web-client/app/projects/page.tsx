import { ProjectList } from "./project-list";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Projects",
};

export default function ProjectsPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>

      <p className="mt-1 text-sm text-zinc-500">Group todos under a project.</p>

      <ProjectList />
    </main>
  );
}
