import createFetchClient from "openapi-fetch";
import createClient from "openapi-react-query";
import type { paths } from "./api-schema";

const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const fetchClient = createFetchClient<paths>({ baseUrl });

export const $api = createClient(fetchClient);
