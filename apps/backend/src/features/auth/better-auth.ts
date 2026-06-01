import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import { account, session, user, verification } from "../../layers/db/schema.ts";
import type { EmailMessage } from "../../layers/email.layer.ts";

const authSchema = { user, session, account, verification };

export interface AuthConfig {
  readonly connectionString: string;
  readonly secret: string;
  readonly baseURL: string;
  readonly webClientUrl: string;
  readonly cookieDomain: string;
  readonly sendEmail: (message: EmailMessage) => Promise<void>;
}

export const makeAuth = (cfg: AuthConfig) => {
  const pool = new Pool({ connectionString: cfg.connectionString });
  const db = drizzle({ client: pool });
  const crossSite = cfg.baseURL.startsWith("https://");

  return betterAuth({
    baseURL: cfg.baseURL,
    basePath: "/api/auth",
    secret: cfg.secret || undefined,
    trustedOrigins: [cfg.webClientUrl],
    database: drizzleAdapter(db, { provider: "pg", schema: authSchema }),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
      sendResetPassword: async ({ user: u, url }) => {
        await cfg.sendEmail({
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
        await cfg.sendEmail({
          to: u.email,
          subject: "Verify your email",
          text: `Hi ${u.name || u.email},\n\nConfirm your email address using the link below:\n${url}`,
        });
      },
    },
    advanced: {
      useSecureCookies: false,
      ...(cfg.cookieDomain
        ? { crossSubDomainCookies: { enabled: true, domain: cfg.cookieDomain } }
        : {}),
      defaultCookieAttributes: crossSite
        ? { sameSite: "none", secure: true, partitioned: true }
        : { sameSite: "lax", secure: false },
    },
  });
};

export type AuthInstance = ReturnType<typeof makeAuth>;

let active: AuthInstance | null = null;

export const setAuthInstance = (instance: AuthInstance): void => {
  active = instance;
};

export const authInstance = (): AuthInstance => {
  if (!active) throw new Error("better-auth instance not initialized");
  return active;
};
