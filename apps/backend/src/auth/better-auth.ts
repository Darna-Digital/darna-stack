import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { account, session, user, verification } from "../db/schema.ts";
import { sendEmail } from "./email.ts";

const authSchema = { user, session, account, verification };

export interface AuthConfig {
  /** Hyperdrive/Postgres connection string (resolved from the binding). */
  readonly connectionString: string;
  readonly secret: string;
  readonly baseURL: string;
  readonly webClientUrl: string;
  readonly cookieDomain: string;
}

/**
 * Build the better-auth instance.
 *
 * better-auth's drizzle adapter expects a *Promise-based* drizzle db (queries
 * are `await`ed). Alchemy's `Drizzle.postgres` is *Effect-based* (queries return
 * Effects, not Promises) — handing that to the adapter makes every `await`
 * hang. So better-auth gets its own `drizzle-orm/node-postgres` db over a `pg`
 * pool on the same Hyperdrive connection string. The pool connects lazily and
 * is intentionally never closed (one per isolate).
 *
 * Cross-domain sessions: the web client is a different origin, so it's added to
 * `trustedOrigins`. In production it's a sibling subdomain, so when
 * `AUTH_COOKIE_DOMAIN` is set we share the cookie across subdomains with
 * `SameSite=None; Secure`.
 */
export const makeAuth = (cfg: AuthConfig) => {
  const pool = new Pool({ connectionString: cfg.connectionString });
  // drizzle 1.0-rc dropped the `schema` option (now `relations`); better-auth's
  // adapter references the table objects directly, so the db needs no schema.
  const db = drizzle({ client: pool });

  return betterAuth({
    baseURL: cfg.baseURL,
    basePath: "/api/auth",
    secret: cfg.secret || undefined,
    trustedOrigins: [cfg.webClientUrl],
    database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
    emailAndPassword: {
      enabled: true,
      // Frictionless sign-up for local dev; a verification email is still sent.
      requireEmailVerification: false,
      sendResetPassword: async ({ user: u, url }) => {
        await sendEmail({
          to: u.email,
          subject: "Reset your password",
          text: `Hi ${u.name || u.email},\n\nReset your password using the link below:\n${url}\n\nIf you didn't request this, you can ignore this email.`,
        });
      },
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: true,
      sendVerificationEmail: async ({ user: u, url }) => {
        await sendEmail({
          to: u.email,
          subject: "Verify your email",
          text: `Hi ${u.name || u.email},\n\nConfirm your email address using the link below:\n${url}`,
        });
      },
    },
    advanced: cfg.cookieDomain
      ? {
          crossSubDomainCookies: { enabled: true, domain: cfg.cookieDomain },
          defaultCookieAttributes: { sameSite: "none", secure: true },
        }
      : {},
  });
};

export type AuthInstance = ReturnType<typeof makeAuth>;
