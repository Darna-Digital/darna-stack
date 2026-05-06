import { Suspense } from "react"
import { ProjectDetail } from "./project-detail"

export const metadata = {
  title: "Project",
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
      <Suspense
        fallback={<p className="text-sm text-zinc-500">Loading…</p>}
      >
        <ProjectDetail id={id} />
      </Suspense>
    </main>
  )
}
