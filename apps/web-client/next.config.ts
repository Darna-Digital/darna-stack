import type { NextConfig } from "next";
import path from "node:path";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Lets `next dev` resolve Cloudflare bindings (env, KV, R2, D1, etc.) via
// `getCloudflareContext()` against the local Wrangler runtime. No-op until
// bindings are configured in wrangler.jsonc.
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  // Pin the workspace root to the monorepo root so Turbopack can resolve the
  // hoisted `next` package through pnpm's symlink farm in `node_modules/.pnpm`.
  // Pointing it at just the app dir makes Turbopack treat the symlink target
  // as out-of-root and refuse to compile.
  turbopack: {
    root: path.resolve(process.cwd(), "../.."),
  },
};

export default nextConfig;
