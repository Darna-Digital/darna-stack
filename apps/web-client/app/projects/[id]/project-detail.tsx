"use client"

import Link from "next/link"
import { $api } from "@/lib/api"

export function ProjectDetail({ id }: { id: string }) {
  const { data: project } = $api.useSuspenseQuery("get", "/api/projects/{id}", {
    params: { path: { id } },
  })
  const { data: todos } = $api.useSuspenseQuery(
    "get",
    "/api/projects/{id}/todos",
    { params: { path: { id } } },
  )

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/projects"
          className="text-xs text-zinc-500 hover:underline"
        >
          ← All projects
        </Link>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight">
          {project.name}
        </h1>
        <p className="mt-1 text-xs text-zinc-500">
          Created {new Date(project.createdAt).toLocaleDateString()}
        </p>
      </div>

      <section>
        <h2 className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          Todos ({todos.length})
        </h2>
        {todos.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">No todos in this project.</p>
        ) : (
          <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-800">
            {todos.map((t) => (
              <li key={t.id} className="flex items-center gap-3 py-3 text-sm">
                <input
                  type="checkbox"
                  checked={t.done}
                  readOnly
                  className="size-4"
                />
                <span
                  className={
                    t.done ? "flex-1 text-zinc-400 line-through" : "flex-1"
                  }
                >
                  {t.title}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
