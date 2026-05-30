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

const CreateTodo = z.object({ title: z.string().trim().min(1, "Required").max(200) });
type CreateTodoInput = z.infer<typeof CreateTodo>;

export function TodoList() {
  const { data: session, isPending } = useSession();
  const authed = !!session;

  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["get", "/api/todos"] });

  // Only the signed-in user's todos (the backend scopes by session).
  const { data: todos = [], isLoading } = $api.useQuery(
    "get",
    "/api/todos",
    {},
    { enabled: authed },
  );

  const create = $api.useMutation("post", "/api/todos", {
    onSuccess: invalidate,
    onError: () => toast.error("Couldn't add todo"),
  });
  const update = $api.useMutation("put", "/api/todos/{id}", { onSuccess: invalidate });
  const remove = $api.useMutation("delete", "/api/todos/{id}", { onSuccess: invalidate });

  const form = useForm<CreateTodoInput>({
    resolver: zodResolver(CreateTodo),
    defaultValues: { title: "" },
  });

  const onSubmit = form.handleSubmit(async ({ title }) => {
    await create.mutateAsync({ body: { title } });
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
        to manage your todos.
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
      ) : todos.length === 0 ? (
        <p className="text-muted-foreground text-sm">No todos yet.</p>
      ) : (
        <ul className="divide-border divide-y rounded-md border">
          {todos.map((t) => (
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
