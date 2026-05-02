# infra

Deployment orchestration for `darna-stack`. Both apps deploy to **Cloudflare Workers**.

| App | Target | Adapter | Config |
|---|---|---|---|
| `@darna/backend` | Workers | native (Hono is fetch-native) | [apps/backend/wrangler.jsonc](../apps/backend/wrangler.jsonc) |
| `@darna/admin`   | Workers | [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) | [apps/admin/wrangler.jsonc](../apps/admin/wrangler.jsonc) |
| `@darna/docs`    | Workers | [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) (Fumadocs) | [apps/docs/wrangler.jsonc](../apps/docs/wrangler.jsonc) |

Workers (not Pages) is the current recommended target for Next.js on Cloudflare.

---

## Prerequisites

1. **Node.js ≥ 22** (Wrangler v4 + OpenNext require it).
2. A Cloudflare account.
3. Auth: `wrangler login` (interactive, recommended for local), OR export `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` (CI).

---

## Deploy

From the monorepo root:

```bash
# all apps
pnpm deploy

# individually
pnpm --filter @darna/backend run deploy
pnpm --filter @darna/admin   run deploy
pnpm --filter @darna/docs    run deploy
```

First deploy of each Worker creates the script and a default `*.workers.dev` URL.

## Local Workers preview (closer-to-prod than `pnpm dev`)

```bash
pnpm --filter @darna/backend run dev:cf      # wrangler dev
pnpm --filter @darna/admin   run preview     # opennext build + wrangler preview
pnpm --filter @darna/docs    run preview     # opennext build + wrangler preview
```

Use these to catch Workers-runtime-only issues (no Node built-ins, request size limits, etc.).

---

## Secrets & vars

- **Non-secret config** — put in `wrangler.jsonc` under `vars`.
- **Secrets** — never commit. Set via:
  ```bash
  cd apps/backend && wrangler secret put DATABASE_URL
  ```
- **Local dev secrets** — `apps/<app>/.dev.vars` (gitignored). Same KEY=VALUE format as `.env`.

---

## Custom domains

Edit each app's `wrangler.jsonc`:

```jsonc
"routes": [
  { "pattern": "api.darna.example.com", "custom_domain": true }
]
```

The zone must already be on Cloudflare and the domain must be in your account.
