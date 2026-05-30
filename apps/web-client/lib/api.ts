import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./api-schema";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

// `credentials: "include"` so the better-auth session cookie rides along on
// cross-origin API calls to the backend.
const fetchClient = createFetchClient<paths>({ baseUrl, credentials: "include" });

export const $api = createClient(fetchClient);
