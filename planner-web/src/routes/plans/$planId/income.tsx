import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/plans/$planId/income")({
  component: IncomeLayout,
})

function IncomeLayout() {
  return <Outlet />
}
