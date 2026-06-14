import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Pencil, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  customIntervalUnit: string | null
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
        <div className="grid gap-4 md:grid-cols-2">
          {expenses.map((expense) => {
            const scheduleLines = getRecurringExpenseScheduleLines(expense)
            return (
              <Card key={expense.id}>
                <CardHeader>
                  <CardTitle>{expense.concept}</CardTitle>
                  <CardDescription>
                    {formatCurrency(expense.amount, plan.currency)} ·&nbsp;
                    {expense.frequency === "custom"
                      ? `Custom / ${
                          expense.customIntervalUnit === "week"
                            ? "Weekly"
                            : "Monthly"
                        }`
                      : expense.frequency}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {scheduleLines.map((line, index) => (
                    <div key={index}>{line}</div>
                  ))}
                  <div>Category: {expense.category ?? "—"}</div>
                  <div>Account: {expense.account ?? "—"}</div>
                  <div className="flex justify-end">
                    <Button asChild variant="outline" size="sm">
                      <Link
                        params={{ planId, recurringExpenseId: expense.id }}
                        to="/plans/$planId/recurring-expenses/$recurringExpenseId"
                      >
                        <Pencil />
                        Edit
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </main>
  )
}
