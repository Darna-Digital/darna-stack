import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Darna</h1>
        <p className="text-muted-foreground max-w-md">
          A separate web client authenticating against the Darna backend with cross-domain email
          sessions.
        </p>
      </div>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/login">Sign in</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/signup">Create account</Link>
        </Button>
      </div>
    </div>
  );
}
