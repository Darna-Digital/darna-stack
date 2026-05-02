import { withAuth, signOut } from "@workos-inc/authkit-nextjs";

export default async function Home() {
  const { user } = await withAuth({ ensureSignedIn: true });

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-8 p-8 bg-zinc-50 dark:bg-black font-sans">
      <div className="w-full max-w-md flex flex-col gap-6 rounded-2xl border border-black/[.08] dark:border-white/[.145] bg-white dark:bg-zinc-950 p-8 shadow-sm">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Darna Admin</h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            You are signed in via WorkOS AuthKit.
          </p>
        </header>

        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
          <dt className="text-zinc-500">Name</dt>
          <dd>
            {user.firstName} {user.lastName}
          </dd>
          <dt className="text-zinc-500">Email</dt>
          <dd>{user.email}</dd>
          <dt className="text-zinc-500">User ID</dt>
          <dd className="font-mono text-xs">{user.id}</dd>
        </dl>

        <form
          action={async () => {
            "use server";
            await signOut();
          }}
        >
          <button
            type="submit"
            className="w-full h-10 rounded-full bg-foreground text-background hover:opacity-90 transition-opacity text-sm font-medium"
          >
            Sign out
          </button>
        </form>
      </div>
    </main>
  );
}
