"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { $api } from "@/lib/api";

const CreateTodo = z.object({
  title: z.string().trim().min(1, "Required").max(200),
  projectId: z.string().uuid().or(z.literal("")).optional(),
});
type CreateTodoInput = z.infer<typeof CreateTodo>;

export function TodoList() {
  // const [hasHydrated, setHasHydrated] = useState(false);
  //
  // useEffect(() => {
  //   setHasHydrated(true);
  // }, []);

  const qc = useQueryClient();
  const invalidateList = () => qc.invalidateQueries({ queryKey: ["get", "/api/todos"] });

  const { data: todos } = $api.useQuery("get", "/api/todos");
  const { data: projects } = $api.useQuery("get", "/api/projects");

  const projectName = (id: string | null) =>
    id ? (projects?.find((p) => p.id === id)?.name ?? "—") : null;

  const create = $api.useMutation("post", "/api/todos", {
    onSuccess: invalidateList,
  });
  const update = $api.useMutation("patch", "/api/todos/{id}", {
    onSuccess: invalidateList,
  });
  const remove = $api.useMutation("delete", "/api/todos/{id}", {
    onSuccess: invalidateList,
  });

  const form = useForm<CreateTodoInput>({
    resolver: zodResolver(CreateTodo),
    defaultValues: { title: "", projectId: "" },
  });

  const onSubmit = form.handleSubmit(async ({ title, projectId }) => {
    await create.mutateAsync({
      body: { title, projectId: projectId ? projectId : null },
    });
    form.reset({ title: "", projectId: projectId ?? "" });
  });

  const titleError = form.formState.errors.title?.message;

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
          <select
            {...form.register("projectId")}
            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-500 dark:border-zinc-700 dark:bg-zinc-900"
          >
            <option value="">No project</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={form.formState.isSubmitting}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900"
          >
            Add
          </button>
        </div>
        {titleError ? <p className="text-xs text-red-600">{titleError}</p> : null}
      </form>

      {todos?.length === 0 ? (
        <p className="text-sm text-zinc-500">No todos yet.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {todos?.map((t) => (
            <li key={t.id} className="flex items-center gap-3 py-3 text-sm">
              <input
                type="checkbox"
                checked={t.done}
                onChange={() =>
                  update.mutate({
                    params: { path: { id: t.id } },
                    body: { done: !t.done },
                  })
                }
                className="size-4"
              />
              <span className={t.done ? "flex-1 text-zinc-400 line-through" : "flex-1"}>
                {t.title}
              </span>
              {t.projectId ? (
                <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
                  {projectName(t.projectId)}
                </span>
              ) : null}
              <button
                type="button"
                onClick={() => remove.mutate({ params: { path: { id: t.id } } })}
                className="text-xs text-zinc-500 hover:text-red-600"
              >
                delete
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
