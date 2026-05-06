import path from "node:path";
import { createMDX } from "fumadocs-mdx/next";
import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

initOpenNextCloudflareForDev();

const withMDX = createMDX();

/** @type {import('next').NextConfig} */
const config = {
  reactStrictMode: true,
  // Pin workspace root to the monorepo root so Turbopack can resolve `next`
  // through pnpm's symlinks in `node_modules/.pnpm`.
  turbopack: {
    root: path.resolve(import.meta.dirname, "../.."),
  },
};

export default withMDX(config);
