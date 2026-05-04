import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import { createTanstackQueryUtils } from "@orpc/tanstack-query"
import type { RouterClient } from "@orpc/server"
import type { router } from "@darna/backend/router"

const baseURL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000"

const link = new RPCLink({
  url: `${baseURL}/rpc`,
})

export const orpc: RouterClient<typeof router> = createORPCClient(link)
export const orpcQuery = createTanstackQueryUtils(orpc)
