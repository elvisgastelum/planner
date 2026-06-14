import { createFileRoute, Outlet } from "@tanstack/react-router"

import { planQueries } from "@/features/plans/data-access/plan.queries"
import { ResourcePageSkeleton } from "@/features/plans/plan-ui"

export const Route = createFileRoute("/plans/$planId/categories")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(planQueries.categories(params.planId)),
  pendingComponent: ResourcePageSkeleton,
  component: CategoriesLayout,
})

function CategoriesLayout() {
  return <Outlet />
}
