import { authkitMiddleware } from "@workos-inc/authkit-nextjs";

// Next.js 16 renamed `middleware.ts` → `proxy.ts`. Same semantics.
// AuthKit's middleware handles session cookies, refresh, and the /callback
// handshake. With `middlewareAuth.enabled: true` it also redirects every
// unauthenticated request to the WorkOS-hosted sign-in page.
export default authkitMiddleware({
  middlewareAuth: {
    enabled: true,
    unauthenticatedPaths: [],
  },
});

export const config = {
  // Run on every route except Next internals and static files.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)"],
};
