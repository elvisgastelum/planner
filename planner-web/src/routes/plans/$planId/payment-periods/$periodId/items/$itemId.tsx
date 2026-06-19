import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute(
  "/plans/$planId/payment-periods/$periodId/items/$itemId"
)({
  component: ItemRouteLayout,
})

function ItemRouteLayout() {
  return <Outlet />
}
