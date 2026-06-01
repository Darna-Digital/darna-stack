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

const CreateProject = z.object({ name: z.string().trim().min(1, "Required").max(200) });
type CreateProjectInput = z.infer<typeof CreateProject>;

export function ProjectList() {
  const { data: session, isPending } = useSession();
  const authed = !!session;

  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["get", "/api/projects"] });

  // Only the signed-in user's projects (the backend scopes by session).
  const { data: projects = [], isLoading } = $api.useQuery(
    "get",
    "/api/projects",
    {},
    { enabled: authed },
  );

  const create = $api.useMutation("post", "/api/projects", {
    onSuccess: invalidate,
    onError: () => toast.error("Couldn't add project"),
  });
  const remove = $api.useMutation("delete", "/api/projects/{id}", { onSuccess: invalidate });

  const form = useForm<CreateProjectInput>({
    resolver: zodResolver(CreateProject),
    defaultValues: { name: "" },
  });

  const onSubmit = form.handleSubmit(async ({ name }) => {
    await create.mutateAsync({ body: { name } });
    form.reset({ name: "" });
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
        to manage your projects.
      </p>
    );
  }

  return (
    <div className="mt-8 space-y-6">
      <form className="space-y-2" onSubmit={onSubmit}>
        <div className="flex gap-2">
          <Input
            placeholder="New project name"
            aria-invalid={form.formState.errors.name ? true : undefined}
            {...form.register("name")}
          />
          <Button type="submit" disabled={form.formState.isSubmitting}>
            Add
          </Button>
        </div>
        {form.formState.errors.name ? (
          <p className="text-destructive text-xs">{form.formState.errors.name.message}</p>
        ) : null}
      </form>

      {isLoading ? (
        <p className="text-muted-foreground text-sm">Loading…</p>
      ) : projects.length === 0 ? (
        <p className="text-muted-foreground text-sm">No projects yet.</p>
      ) : (
        <ul className="divide-border divide-y rounded-md border">
          {projects.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-3 py-2 text-sm">
              <Link
                href={`/projects/${p.id}`}
                className="hover:text-foreground flex-1 underline-offset-4 hover:underline"
              >
                {p.name}
              </Link>
              <button
                type="button"
                onClick={() => remove.mutate({ params: { path: { id: p.id } } })}
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
