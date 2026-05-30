import { createAuthClient } from "better-auth/react";

// The backend lives on a different origin than this app, so every auth request
// must carry cookies cross-domain (`credentials: "include"`). The client
// appends better-auth's default `/api/auth` base path to this URL.
const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

export const authClient = createAuthClient({
  baseURL,
  fetchOptions: {
    credentials: "include",
  },
});

export const { signIn, signUp, signOut, useSession, requestPasswordReset, resetPassword } =
  authClient;
