import { createFileRoute, Outlet } from "@tanstack/react-router"

import { planQueries } from "@/features/plans/data-access/plan.queries"
import { ResourcePageSkeleton } from "@/features/plans/plan-ui"

export const Route = createFileRoute("/plans/$planId/accounts")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(planQueries.accounts(params.planId)),
  pendingComponent: ResourcePageSkeleton,
  component: AccountsLayout,
})

function AccountsLayout() {
  return <Outlet />
}
