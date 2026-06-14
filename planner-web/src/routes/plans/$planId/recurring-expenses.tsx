import { createFileRoute, Outlet } from "@tanstack/react-router"

export const Route = createFileRoute("/plans/$planId/recurring-expenses")({
  component: RecurringExpensesLayout,
})

function RecurringExpensesLayout() {
  return <Outlet />
}
