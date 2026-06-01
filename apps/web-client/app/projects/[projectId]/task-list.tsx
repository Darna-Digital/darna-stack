"use client";

import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { $api } from "@/lib/api";
import { useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const CreateTask = z.object({ title: z.string().trim().min(1, "Required").max(200) });
type CreateTaskInput = z.infer<typeof CreateTask>;

export function TaskList({ projectId }: { projectId: string }) {
  const { data: session, isPending } = useSession();
  const authed = !!session;

  const qc = useQueryClient();
  // Partial key — matches every param variation of this list query.
  const invalidate = () =>
    qc.invalidateQueries({ queryKey: ["get", "/api/projects/{projectId}/tasks"] });

  const pathParams = { params: { path: { projectId } } } as const;

  // Tasks of this project; the backend authorizes access through the project owner.
  const { data: tasks = [], isLoading } = $api.useQuery(
    "get",
    "/api/projects/{projectId}/tasks",
    pathParams,
    { enabled: authed },
  );

  const create = $api.useMutation("post", "/api/projects/{projectId}/tasks", {
    onSuccess: invalidate,
    onError: () => toast.error("Couldn't add task"),
  });
  const update = $api.useMutation("put", "/api/tasks/{id}", { onSuccess: invalidate });
  const remove = $api.useMutation("delete", "/api/tasks/{id}", { onSuccess: invalidate });

  const form = useForm<CreateTaskInput>({
    resolver: zodResolver(CreateTask),
    defaultValues: { title: "" },
  });

  const onSubmit = form.handleSubmit(async ({ title }) => {
    await create.mutateAsync({ params: { path: { projectId } }, body: { title } });
    form.reset({ title: "" });
  });

  if (isPending) {
    return <p className="text-muted-foreground mt-8 text-sm">Loading…</p>;
  }

  if (!authed) {
    return (
      <p className="text-muted-foreground mt-8 text-sm">
        Please{" "}
        <Link href="/login" className="text-foreground underline underline-offset-4">
          sign in
        </Link>{" "}
        to manage your tasks.
      </p>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <form className="space-y-2" onSubmit={onSubmit}>
        <div className="flex gap-2">
          <Input
            placeholder="What needs doing?"
            aria-invalid={form.formState.errors.title ? true : undefined}
            {...form.register("title")}
          />
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Add
          </Button>
        </div>
        {form.formState.errors.title ? (
          <p className="text-destructive text-xs">{form.formState.errors.title.message}</p>
        ) : null}
      </form>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : tasks.length === 0 ? (
        <p className="text-muted-foreground text-sm">No tasks yet.</p>
      ) : (
        <ul className="divide-border divide-y rounded-md border">
          {tasks.map((t) => (
            <li key={t.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={t.done}
                aria-label={`Mark "${t.title}" ${t.done ? "not done" : "done"}`}
                onChange={() =>
                  update.mutate({ params: { path: { id: t.id } }, body: { done: !t.done } })
                }
                className="size-4"
              />
              <span className={t.done ? "text-muted-foreground flex-1 line-through" : "flex-1"}>
                {t.title}
              </span>
              <button
                type="button"
                onClick={() => remove.mutate({ params: { path: { id: t.id } } })}
                className="text-muted-foreground hover:text-destructive text-xs"
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
