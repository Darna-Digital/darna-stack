"use client"

import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query"
import { CreateTodo, type CreateTodo as CreateTodoInput } from "@darna/backend/schemas/todo"
import { orpcQuery } from "@/lib/orpc"

export function TodoList() {
  const qc = useQueryClient()
  const todoKey = orpcQuery.todo.key()
  const invalidate = () => qc.invalidateQueries({ queryKey: todoKey })

  const { data: todos } = useSuspenseQuery(orpcQuery.todo.list.queryOptions())

  const create = useMutation(
    orpcQuery.todo.create.mutationOptions({ onSuccess: invalidate }),
  )
  const update = useMutation(
    orpcQuery.todo.update.mutationOptions({ onSuccess: invalidate }),
  )
  const remove = useMutation(
    orpcQuery.todo.remove.mutationOptions({ onSuccess: invalidate }),
  )

  const form = useForm<CreateTodoInput>({
    resolver: zodResolver(CreateTodo),
    defaultValues: { title: "" },
  })

  const onSubmit = form.handleSubmit(async (input) => {
    await create.mutateAsync(input)
    form.reset()
  })

  const titleError = form.formState.errors.title?.message

  return (
    <div className="mt-8 space-y-6">
      <form className="space-y-2" onSubmit={onSubmit}>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="What needs doing?"
            aria-invalid={titleError ? "true" : "false"}
            {...form.register("title")}
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
        {titleError ? (
          <p className="text-xs text-red-600">{titleError}</p>
        ) : null}
      </form>

      {todos.length === 0 ? (
        <p className="text-sm text-zinc-500">No todos yet.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {todos.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-3 text-sm">
              <input
                type="checkbox"
                checked={t.done}
                onChange={() =>
                  update.mutate({ id: t.id, patch: { done: !t.done } })
                }
                className="size-4"
              />
              <span
                className={
                  t.done ? "flex-1 text-zinc-400 line-through" : "flex-1"
                }
              >
                {t.title}
              </span>
              <button
                type="button"
                onClick={() => remove.mutate({ id: t.id })}
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
