"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { signOut, useSession } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

type ApiMe = { id: string; email: string; name: string; emailVerified: boolean } | null;

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [apiMe, setApiMe] = useState<ApiMe>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  // Client-side guard: bounce unauthenticated visitors to the login screen.
  useEffect(() => {
    if (!isPending && !session) router.replace("/login");
  }, [isPending, session, router]);

  // Independently confirm the session cookie reaches the Effect backend
  // cross-origin by hitting the cookie-guarded /api/me endpoint.
  useEffect(() => {
    if (!session) return;
    fetch(`${apiUrl}/api/me`, { credentials: "include" })
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        setApiMe((await res.json()) as ApiMe);
      })
      .catch((err: unknown) => setApiError(err instanceof Error ? err.message : "request failed"));
  }, [session]);

  if (isPending || !session) {
    return <div className="text-muted-foreground p-8 text-sm">Loading…</div>;
  }

  const onSignOut = async () => {
    await signOut();
    router.push("/login");
    router.refresh();
  };

  return (
    <div className="mx-auto w-full max-w-2xl space-y-6 px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Welcome, {session.user.name}</CardTitle>
          <CardDescription>You are signed in via better-auth.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 text-sm">
          <div className="grid grid-cols-[120px_1fr] gap-y-2">
            <span className="text-muted-foreground">Email</span>
            <span>{session.user.email}</span>
            <span className="text-muted-foreground">Verified</span>
            <span>{session.user.emailVerified ? "Yes" : "No"}</span>
            <span className="text-muted-foreground">User ID</span>
            <span className="font-mono text-xs">{session.user.id}</span>
          </div>

          <div className="bg-muted/50 rounded-md border p-3">
            <p className="text-muted-foreground mb-1 text-xs font-medium">
              Cross-domain check — GET {apiUrl}/api/me
            </p>
            {apiError ? (
              <p className="text-destructive text-xs">Failed: {apiError}</p>
            ) : apiMe ? (
              <pre className="overflow-x-auto text-xs">{JSON.stringify(apiMe, null, 2)}</pre>
            ) : (
              <p className="text-muted-foreground text-xs">Checking…</p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button variant="outline" onClick={onSignOut}>
            Sign out
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
