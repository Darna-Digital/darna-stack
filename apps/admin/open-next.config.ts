import { defineCloudflareConfig } from "@opennextjs/cloudflare"

// Minimal config — uses the default in-memory incremental cache for now.
// TODO: switch to `r2IncrementalCache` once we have real ISR pages and an R2 bucket.
export default defineCloudflareConfig({})
