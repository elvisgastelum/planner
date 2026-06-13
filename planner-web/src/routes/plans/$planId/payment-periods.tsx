import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/plans/$planId/payment-periods")({
  component: PaymentPeriodsLayout,
})

function PaymentPeriodsLayout() {
  return <Outlet />
}
