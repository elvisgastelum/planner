import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Pencil, Plus } from "lucide-react"

import { ResourceCard } from "@/components/resource-card"
import { ResourceList } from "@/components/resource-list"
import { Button } from "@/components/ui/button"
import { planQueries } from "@/features/plans/data-access/plan.queries"
import { EmptyState, ResourcePageSkeleton } from "@/features/plans/plan-ui"
import { formatCurrency } from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute("/plans/$planId/recurring-expenses/")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(planQueries.detail(params.planId)),
      context.queryClient.ensureQueryData(
        planQueries.recurringExpenseList(params.planId)
      ),
    ]),
  pendingComponent: ResourcePageSkeleton,
  component: RecurringExpensesListPage,
})

function getRecurringExpenseScheduleLines(expense: {
  frequency: string
  day: number | null
  days: Array<{ day: number }>
  customIntervalUnit?: string | null
}): string[] {
  const { frequency, day, days, customIntervalUnit } = expense

  if (frequency === "monthly" || frequency === "monthly_until_liquidated") {
    if (day != null) {
      return [`Day: ${day}`]
    }
    return []
  }

  if (frequency === "twice_monthly") {
    if (days.length > 0) {
      const sortedDays = [...days].map((d) => d.day).sort((a, b) => a - b)
      return [`Days: ${sortedDays.join(", ")}`]
    }
    return []
  }

  if (frequency === "custom") {
    if (days.length > 0) {
      const sortedDays = [...days].map((d) => d.day).sort((a, b) => a - b)
      if (customIntervalUnit === "week") {
        const weekdayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
        const dayNames = sortedDays
          .map((d) => weekdayNames[d - 1] || d)
          .join(", ")
        return [`Days: ${dayNames}`]
      }
      return [`Days: ${sortedDays.join(", ")}`]
    }
    return []
  }

  return []
}

function RecurringExpensesListPage() {
  const { planId } = Route.useParams()
  const { data: plan } = useSuspenseQuery(planQueries.detail(planId))
  const { data: expenses } = useSuspenseQuery(
    planQueries.recurringExpenseList(planId)
  )

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Recurring expenses</h1>
          <p className="text-sm text-muted-foreground">
            Read-only list of periodic obligations.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link params={{ planId }} to="/plans/$planId">
              <ArrowLeft />
              Back to plan
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link
              params={{ planId }}
              to="/plans/$planId/recurring-expenses/new"
            >
              <Plus />
              New expense
            </Link>
          </Button>
        </div>
      </header>

      {expenses.length === 0 ? (
        <EmptyState
          description="Create your first recurring expense to start planning future items."
          title="No recurring expenses yet"
        />
      ) : (
        <ResourceList>
          {expenses.map((expense) => {
            const scheduleLines = getRecurringExpenseScheduleLines(expense)
            return (
              <ResourceCard
                key={expense.id}
                title={expense.concept}
                description={`${formatCurrency(expense.amount, plan.currency)} · ${
                  expense.frequency === "custom"
                    ? `Custom / ${(expense as Record<string, unknown>).customIntervalUnit === "week" ? "Weekly" : "Monthly"}`
                    : expense.frequency
                }`}
                metadata={[
                  {
                    label: "Category",
                    value: expense.category ?? "—",
                  },
                  {
                    label: "Account",
                    value: expense.account ?? "—",
                  },
                ]}
                actions={
                  <Button asChild variant="outline" size="sm">
                    <Link
                      params={{ planId, recurringExpenseId: expense.id }}
                      to="/plans/$planId/recurring-expenses/$recurringExpenseId"
                    >
                      <Pencil />
                      Edit
                    </Link>
                  </Button>
                }
              >
                {scheduleLines.map((line, index) => (
                  <div key={index}>{line}</div>
                ))}
              </ResourceCard>
            )
          })}
        </ResourceList>
      )}
    </main>
  )
}
