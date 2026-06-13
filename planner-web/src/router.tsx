import { createRouter } from "@tanstack/react-router"

import { queryClient } from "@/api/query-client"

import { routeTree } from "./routeTree.gen"

export const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPendingMs: 200,
  defaultPendingMinMs: 300,
})

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router
  }
}
