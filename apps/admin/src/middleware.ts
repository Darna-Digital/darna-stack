import { authkitMiddleware } from "@workos-inc/authkit-nextjs";

// Why `middleware.ts` and not the new `proxy.ts`:
//   Next 16 hard-codes proxy.ts to the Node runtime and forbids the `runtime`
//   config there. OpenNext for Cloudflare can only host *Edge* middleware.
//   The deprecated `middleware.ts` filename still works in Next 16 *and* lets
//   us opt into Edge via `runtime: "experimental-edge"` — so we use that until
//   either OpenNext supports Node middleware or Next finishes the migration.
//
// Two warnings appear at build time and are expected:
//   1. "middleware file convention is deprecated"
//   2. "experimental edge runtime, API might change"

export default authkitMiddleware({
  middlewareAuth: { enabled: true, unauthenticatedPaths: [] },
});

export const config = {
  runtime: "experimental-edge",
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
