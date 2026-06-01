import Link from "next/link";
import { TaskList } from "./task-list";

export const metadata = {
  title: "Tasks",
};

export default async function ProjectTasksPage({
  params,
}: {
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;

  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
      <Link
        href="/projects"
        className="text-muted-foreground hover:text-foreground text-sm underline-offset-4 hover:underline"
      >
        ← Projects
      </Link>

      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Tasks</h1>

      <p className="mt-1 text-sm text-zinc-500">End-to-end typed via open api + Effect.</p>

      <TaskList projectId={projectId} />
    </main>
  );
}
