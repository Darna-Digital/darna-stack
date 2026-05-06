"use client"

import Link from "next/link"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useQueryClient } from "@tanstack/react-query"
import { z } from "zod"
import { $api } from "@/lib/api"

const CreateProject = z.object({
  name: z.string().trim().min(1, "Required").max(200),
})
type CreateProjectInput = z.infer<typeof CreateProject>

export function ProjectList() {
  const qc = useQueryClient()
  const invalidateList = () =>
    qc.invalidateQueries({ queryKey: ["get", "/api/projects"] })

  const { data: projects } = $api.useSuspenseQuery("get", "/api/projects")

  const create = $api.useMutation("post", "/api/projects", {
    onSuccess: invalidateList,
  })
  const remove = $api.useMutation("delete", "/api/projects/{id}", {
    onSuccess: invalidateList,
  })

  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(CreateProject),
    defaultValues: { name: "" },
  })

  const onSubmit = form.handleSubmit(async (input) => {
    await create.mutateAsync({ body: input })
    form.reset()
  })

  const nameError = form.formState.errors.name?.message

  return (
    <div className="mt-8 space-y-6">
      <form className="space-y-2" onSubmit={onSubmit}>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="New project name"
            aria-invalid={nameError ? "true" : "false"}
            {...form.register("name")}
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 aria-[invalid=true]:border-red-500 dark:border-zinc-700 dark:bg-zinc-900"
          />
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Add
          </button>
        </div>
        {nameError ? <p className="text-xs text-red-600">{nameError}</p> : null}
      </form>

      {projects.length === 0 ? (
        <p className="text-sm text-zinc-500">No projects yet.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {projects.map((p) => (
            <li key={p.id} className="flex items-center gap-3 py-3 text-sm">
              <Link
                href={`/projects/${p.id}`}
                className="flex-1 hover:underline"
              >
                {p.name}
              </Link>
              <button
                type="button"
                onClick={() =>
                  remove.mutate({ params: { path: { id: p.id } } })
                }
                className="text-xs text-zinc-500 hover:text-red-600"
              >
                delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
