import { createFileRoute, Outlet } from "@tanstack/react-router"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { planQueries } from "@/features/plans/data-access/plan.queries"
import { ResourcePageSkeleton } from "@/features/plans/plan-ui"

export const Route = createFileRoute("/plans/$planId")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(planQueries.detail(params.planId)),
  component: RouteComponent,
  pendingComponent: ResourcePageSkeleton,
  errorComponent: ({ error, reset }) => (
    <main className="mx-auto w-full max-w-6xl p-6 text-sm text-destructive">
      <Card>
        <CardHeader>
          <CardTitle>Error</CardTitle>
          <CardDescription>{error.message}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Button onClick={reset}>Reload</Button>
        </CardContent>
      </Card>
    </main>
  ),
})

function RouteComponent() {
  return <Outlet />
}
