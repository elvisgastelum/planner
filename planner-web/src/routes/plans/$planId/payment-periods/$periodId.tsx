import { createFileRoute, Outlet } from "@tanstack/react-router"

import { ResourcePageSkeleton } from "@/features/plans/plan-ui"

export const Route = createFileRoute(
  "/plans/$planId/payment-periods/$periodId"
)({
  pendingComponent: ResourcePageSkeleton,
  component: PaymentPeriodLayout,
})

function PaymentPeriodLayout() {
  return <Outlet />
}
