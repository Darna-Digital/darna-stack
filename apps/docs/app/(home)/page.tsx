import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center text-center gap-4 px-4">
      <h1 className="text-3xl font-bold">Darna Docs</h1>
      <p className="text-fd-muted-foreground">
        Documentation for the Darna stack.
      </p>
      <Link
        href="/docs"
        className="text-fd-foreground font-semibold underline"
      >
        Open the docs →
      </Link>
    </main>
  );
}
