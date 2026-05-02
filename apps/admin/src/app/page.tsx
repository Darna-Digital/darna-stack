import { withAuth, signOut } from "@workos-inc/authkit-nextjs";

const BACKEND_URL = process.env.BACKEND_URL ?? "http://localhost:4000";

async function pingAdminMe(
  accessToken: string,
): Promise<
  | { ok: true; status: number; body: unknown }
  | { ok: false; status: number; body: string }
> {
  try {
    const res = await fetch(`${BACKEND_URL}/admin/me`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    const text = await res.text();
    if (res.ok) {
      try {
        return { ok: true, status: res.status, body: JSON.parse(text) };
      } catch {
        return { ok: true, status: res.status, body: text };
      }
    }
    return { ok: false, status: res.status, body: text };
  } catch (e) {
    return {
      ok: false,
      status: 0,
      body: e instanceof Error ? e.message : String(e),
    };
  }
}

export default async function Home() {
  const { user, accessToken } = await withAuth({ ensureSignedIn: true });
  const ping = await pingAdminMe(accessToken);

  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 p-8 bg-zinc-50 dark:bg-black font-sans">
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

      <div className="w-full max-w-md flex flex-col gap-3 rounded-2xl border border-black/[.08] dark:border-white/[.145] bg-white dark:bg-zinc-950 p-8 shadow-sm">
        <header className="flex items-center justify-between gap-4">
          <div>
            <h2 className="text-base font-semibold tracking-tight">
              Backend · GET /admin/me
            </h2>
            <p className="text-xs text-zinc-500 break-all">{BACKEND_URL}</p>
          </div>
          <span
            className={
              "shrink-0 rounded-full px-2 py-0.5 text-xs font-medium " +
              (ping.ok
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
                : "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200")
            }
          >
            {ping.status || "ERR"}
          </span>
        </header>

        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          {ping.ok
            ? "✓ adminMiddleware accepted the WorkOS access token."
            : "✗ Request failed — see body below."}
        </p>

        <pre className="overflow-auto rounded-lg bg-zinc-100 dark:bg-zinc-900 p-3 text-xs leading-relaxed">
          {typeof ping.body === "string"
            ? ping.body
            : JSON.stringify(ping.body, null, 2)}
        </pre>
      </div>
    </main>
  );
}
