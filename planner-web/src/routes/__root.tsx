import type { QueryClient } from "@tanstack/react-query"
import {
  createRootRouteWithContext,
  Link,
  Outlet,
} from "@tanstack/react-router"
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools"
import { NuqsAdapter } from "nuqs/adapters/tanstack-router"

type RouterContext = {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
  notFoundComponent: () => (
    <main className="mx-auto flex min-h-svh w-full max-w-5xl flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Page not found</h1>
      <Link
        className="text-primary underline-offset-4 hover:underline"
        to="/plans"
      >
        Go to plans
      </Link>
    </main>
  ),
})

function RootLayout() {
  return (
    <>
      <div className="min-h-svh bg-background text-foreground">
        <header className="border-b bg-card/60">
          <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-4 px-6 py-4">
            <Link className="font-semibold tracking-tight" to="/plans">
              Planner
            </Link>
            <nav className="flex items-center gap-3 text-sm">
              <Link
                activeProps={{ className: "text-foreground" }}
                className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                to="/plans"
              >
                Plans
              </Link>
              <Link
                activeProps={{ className: "text-foreground" }}
                className="text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                to="/health"
              >
                Health
              </Link>
            </nav>
          </div>
        </header>
        <NuqsAdapter>
          <Outlet />
        </NuqsAdapter>
      </div>
      {import.meta.env.DEV ? <TanStackRouterDevtools /> : null}
    </>
  )
}
