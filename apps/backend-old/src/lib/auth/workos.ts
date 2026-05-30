import { createRemoteJWKSet, jwtVerify, type JWTPayload } from "jose";

/**
 * Claims on a WorkOS access token (AuthKit / User Management).
 * See https://workos.com/docs/user-management/jwt-tokens
 */
export interface WorkOSAccessTokenPayload extends JWTPayload {
  sub: string;
  sid?: string;
  org_id?: string;
  role?: string;
  permissions?: readonly string[];
  entitlements?: readonly string[];
}

const WORKOS_JWKS_BASE = "https://api.workos.com/sso/jwks";

let cachedJwks: ReturnType<typeof createRemoteJWKSet> | null = null;

const getJwks = () => {
  if (cachedJwks) return cachedJwks;
  const clientId = process.env.WORKOS_CLIENT_ID;
  if (!clientId) {
    throw new Error(
      "WORKOS_CLIENT_ID is not set — required for adminMiddleware to verify WorkOS access tokens.",
    );
  }
  cachedJwks = createRemoteJWKSet(new URL(`${WORKOS_JWKS_BASE}/${clientId}`));
  return cachedJwks;
};

export const verifyWorkOSAccessToken = async (token: string): Promise<WorkOSAccessTokenPayload> => {
  const { payload } = await jwtVerify(token, getJwks());
  return payload as WorkOSAccessTokenPayload;
};
