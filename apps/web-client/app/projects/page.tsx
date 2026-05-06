import { Suspense } from "react"
import { ProjectList } from "./project-list"

export const metadata = {
  title: "Projects",
}

export default function ProjectsPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
      <h1 className="text-2xl font-semibold tracking-tight">Projects</h1>
      <p className="mt-1 text-sm text-zinc-500">
        Group todos under a project.
      </p>
      <Suspense
        fallback={<p className="mt-8 text-sm text-zinc-500">Loading…</p>}
      >
        <ProjectList />
      </Suspense>
    </main>
  )
}
