import { handleAuth } from "@workos-inc/authkit-nextjs";

// OAuth callback target. `WORKOS_REDIRECT_URI` must point here, e.g.
// http://localhost:3000/callback in dev.
export const GET = handleAuth();
