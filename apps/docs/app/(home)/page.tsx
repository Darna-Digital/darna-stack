import Link from "next/link";

const sections: { href: string; title: string; description: string }[] = [
  {
    href: "/docs/local-dev",
    title: "Local dev",
    description:
      "Clone, fill in .env, run pnpm dev. The whole stack — backend, admin, web client, docs — comes up on four ports.",
  },
  {
    href: "/docs",
    title: "Architecture",
    description:
      "Bird's-eye view: a pnpm monorepo that ships entirely to Cloudflare Workers, with WorkOS handling auth across every boundary.",
  },
  {
    href: "/docs/backend",
    title: "Backend",
    description:
      "Hono on Workers, Effect HttpApi for routing, drizzle-orm via Hyperdrive. Every feature lives in its own vertical slice.",
  },
  {
    href: "/docs/web-client",
    title: "Web client",
    description:
      "OpenAPI codegen + openapi-react-query. End-to-end type safety from the route signature in TypeScript to the React Query hook.",
  },
  {
    href: "/docs/auth",
    title: "Auth",
    description:
      "WorkOS AuthKit signs the user in; the backend verifies the JWT against the public JWKS. No session calls between services.",
  },
  {
    href: "/docs/tracing",
    title: "Tracing",
    description:
      "OpenTelemetry to Grafana via @microlabs/otel-cf-workers. Every Effect.withSpan call shows up alongside the auto-instrumented Hyperdrive and fetch spans.",
  },
];

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center px-6 py-20">
      <div className="w-full max-w-3xl">
        <header className="mb-16">
          <h1 className="text-5xl font-semibold tracking-tight mb-4">Darna Stack</h1>
          <p className="text-lg text-fd-muted-foreground leading-relaxed">
            A pnpm monorepo that ships to Cloudflare Workers. Hono and Effect on the backend,
            Next.js 16 on the frontends, OpenAPI between them, and OpenTelemetry through it all.
          </p>
        </header>

        <section className="grid gap-3 sm:grid-cols-2">
          {sections.map((s) => (
            <Link
              key={s.href}
              href={s.href}
              className="group rounded-lg border border-fd-border bg-fd-card p-5 transition-colors hover:border-fd-foreground/40 hover:bg-fd-accent"
            >
              <h2 className="text-base font-semibold mb-1.5 group-hover:underline">{s.title}</h2>
              <p className="text-sm text-fd-muted-foreground leading-relaxed">{s.description}</p>
            </Link>
          ))}
        </section>

        <footer className="mt-16 text-sm text-fd-muted-foreground">
          New to the codebase? Start with{" "}
          <Link href="/docs/local-dev" className="text-fd-foreground underline">
            Local dev
          </Link>
          .
        </footer>
      </div>
    </main>
  );
}
