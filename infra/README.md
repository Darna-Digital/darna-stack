# infra

Deployment orchestration for `darna-stack`. Every app deploys to **Cloudflare Workers**.

| App | Target | Adapter | Config |
|---|---|---|---|
| `@darna/backend` | Workers | native (Hono is fetch-native) | [apps/backend/wrangler.jsonc](../apps/backend/wrangler.jsonc) |
| `@darna/admin`   | Workers | [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) | [apps/admin/wrangler.jsonc](../apps/admin/wrangler.jsonc) |
| `@darna/docs`    | Workers | [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare) | [apps/docs/wrangler.jsonc](../apps/docs/wrangler.jsonc) |

Workers (not Pages) is the current recommended target for Next.js on Cloudflare.

---

## Environments

Two environments, mapped 1:1 to git branches, Cloudflare Workers, and subdomains of `darnadigital.com`:

| Branch    | Env          | Backend                                    | Admin                                    | Docs                              |
|-----------|--------------|--------------------------------------------|------------------------------------------|-----------------------------------|
| `master`  | `production` | `darna-stack-backend.darnadigital.com`     | `darna-stack-admin.darnadigital.com`     | `darna-stack.darnadigital.com`    |
| `staging` | `staging`    | `staging-darna-stack-backend.darnadigital.com` | `staging-darna-stack-admin.darnadigital.com` | `staging-darna-stack.darnadigital.com` |

Each Worker also has a fallback `*.workers.dev` URL — useful for ad-hoc preview but not the canonical address.

The mapping lives in each app's `wrangler.jsonc` (top-level = production, `env.staging` overrides name + route). CI selects the env with `--env staging` for the staging branch and no flag for master.

---

## CI: GitHub Actions

[`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml) deploys all three apps on every push to `master` or `staging`. It also supports `workflow_dispatch` if you need to redeploy manually.

The job uses GitHub's environment feature to load per-env secrets and vars — `production` for master, `staging` for staging.

### One-time setup

#### 1. Cloudflare side

1. **Add the zone**. In dash.cloudflare.com, add `darnadigital.com` as a site. Cloudflare gives you two nameservers — set them at your registrar (or transfer the domain to Cloudflare Registrar). Wait until the dashboard shows the zone as **Active**. This is the prerequisite for all Worker custom domains; without it, deploys fail with "zone not found".
2. **Find your Account ID**: dash.cloudflare.com → Workers & Pages → right sidebar.
3. **Create an API token** at [dash.cloudflare.com/profile/api-tokens](https://dash.cloudflare.com/profile/api-tokens) → **Create Token** → "Edit Cloudflare Workers" template. Restrict it to your account. The template already includes the scopes needed to attach Worker custom domains and create DNS records. Copy the token now — it's not shown again.
4. **First deploy each Worker manually** from your laptop so the scripts exist (and so wrangler can claim the custom domains and provision certs):
   ```bash
   pnpm --filter @darna/backend exec wrangler login   # one-time, interactive

   # production
   pnpm --filter @darna/backend exec wrangler deploy
   pnpm --filter @darna/admin   exec opennextjs-cloudflare deploy
   pnpm --filter @darna/docs    exec opennextjs-cloudflare deploy

   # staging
   pnpm --filter @darna/backend exec wrangler deploy --env staging
   pnpm --filter @darna/admin   exec opennextjs-cloudflare deploy --env staging
   pnpm --filter @darna/docs    exec opennextjs-cloudflare deploy --env staging
   ```
   On first deploy with `routes` configured, Wrangler claims each subdomain on the `darnadigital.com` zone and creates the DNS record. Cloudflare's Universal SSL (free) covers every single-level subdomain under `darnadigital.com`, so cert provisioning is essentially instant. Workers Custom Domains may still show a brief "Provisioning" state in the dashboard for a few seconds — that's the Worker hostname binding, not the cert.
5. **Worker runtime secrets** are managed by the CI workflow — it pipes them into `wrangler secret put` after each deploy. You don't need to set them manually. Just put the values in GitHub Environment secrets in step 6 below. (They're still env-isolated on the Cloudflare side: production and staging Workers each have their own copy.)
6. **Add the callback URLs in WorkOS** → dashboard → Redirects:
   - `https://darna-stack-admin.darnadigital.com/callback`
   - `https://staging-darna-stack-admin.darnadigital.com/callback`
   These must be whitelisted exactly, otherwise WorkOS rejects the OAuth handshake with `redirect_uri_mismatch`.

#### 2. GitHub side

In the repo: **Settings → Environments → New environment**, create two: `production` and `staging`. For each one, add:

**Secrets:**

| Name | Value | Used by |
|---|---|---|
| `CLOUDFLARE_API_TOKEN` | The token from step 3 | Wrangler — deploy auth |
| `CLOUDFLARE_ACCOUNT_ID` | Account ID from step 2 | Wrangler — target account |
| `WORKOS_API_KEY` | `sk_…` from WorkOS dashboard | Synced to admin Worker by CI |
| `WORKOS_CLIENT_ID` | `client_…` from WorkOS dashboard | Synced to admin + backend Workers by CI |
| `WORKOS_COOKIE_PASSWORD` | 32+ chars, `openssl rand -base64 32` | Synced to admin Worker by CI |

CI sets the WORKOS_* values onto the right Worker via `wrangler secret put` after each deploy. Use the same values across environments unless you want isolated WorkOS user pools per environment, in which case set different `WORKOS_CLIENT_ID`s.

**Variables** (not secret, just env-specific — baked into the Next.js bundle at build time):

| Name | production | staging |
|---|---|---|
| `NEXT_PUBLIC_WORKOS_REDIRECT_URI` | `https://darna-stack-admin.darnadigital.com/callback` | `https://staging-darna-stack-admin.darnadigital.com/callback` |
| `BACKEND_URL` | `https://darna-stack-backend.darnadigital.com` | `https://staging-darna-stack-backend.darnadigital.com` |

Optionally configure **deployment branch restrictions** on each environment so only `master` can deploy to `production` and only `staging` can deploy to `staging`. This prevents an accidental `workflow_dispatch` from the wrong branch.

#### 3. Done

After the one-time setup, every push to `master` deploys production; every push to `staging` deploys staging. Both run typecheck before deploy.

---

## Local

```bash
# all apps in parallel
pnpm dev

# one at a time
pnpm dev:backend         # tsx watch on Node, :4000
pnpm dev:admin           # next dev, :3000
pnpm dev:docs            # next dev, :3001

# closer-to-prod (Workers runtime locally)
pnpm --filter @darna/backend dev:cf       # wrangler dev
pnpm --filter @darna/admin   preview      # opennext build + wrangler preview
pnpm --filter @darna/docs    preview
```

`pnpm dev:backend` reads `apps/backend/.env` (Node 22's `--env-file-if-exists`).
`wrangler dev` reads `apps/<app>/.dev.vars`.
`next dev` reads `apps/<app>/.env.local`.

---

## Deploying from your laptop

The CI workflow is the canonical path, but you can deploy from local too:

```bash
# production
pnpm deploy
# or per-app
pnpm --filter @darna/backend run deploy
pnpm --filter @darna/admin   run deploy
pnpm --filter @darna/docs    run deploy

# staging — pass --env staging to wrangler / opennext directly
pnpm --filter @darna/backend exec wrangler deploy --env staging
pnpm --filter @darna/admin   exec opennextjs-cloudflare deploy --env staging
pnpm --filter @darna/docs    exec opennextjs-cloudflare deploy --env staging
```

`wrangler login` once and you're set — no token needed for interactive use.

---

## Custom domains

Already wired up in each `wrangler.jsonc`:

| App | Production | Staging |
|---|---|---|
| backend | `darna-stack-backend.darnadigital.com` | `staging-darna-stack-backend.darnadigital.com` |
| admin   | `darna-stack-admin.darnadigital.com`   | `staging-darna-stack-admin.darnadigital.com`   |
| docs    | `darna-stack.darnadigital.com`         | `staging-darna-stack.darnadigital.com`         |

`custom_domain: true` makes Wrangler create the DNS record and provision the Edge Certificate automatically on first deploy — no DNS work in the dashboard.

To add another subdomain, add to the `routes` array of the right env:

```jsonc
"env": {
  "staging": {
    "routes": [
      { "pattern": "staging-darna-stack-backend.darnadigital.com", "custom_domain": true },
      { "pattern": "alt-staging-darna-stack-backend.darnadigital.com", "custom_domain": true }
    ]
  }
}
```

The zone has to be on your Cloudflare account first (see step 1 above).
