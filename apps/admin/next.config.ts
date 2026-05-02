import type { NextConfig } from "next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

// Lets `next dev` resolve Cloudflare bindings (env, KV, R2, D1, etc.) via
// `getCloudflareContext()` against the local Wrangler runtime. No-op until
// bindings are configured in wrangler.jsonc.
initOpenNextCloudflareForDev();

const nextConfig: NextConfig = {
  /* config options here */
};

export default nextConfig;
