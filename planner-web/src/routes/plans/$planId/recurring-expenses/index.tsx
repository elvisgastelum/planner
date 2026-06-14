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
          {expenses.map((expense) => (
            <Card key={expense.id}>
              <CardHeader>
                <CardTitle>{expense.concept}</CardTitle>
                <CardDescription>
                  {formatCurrency(expense.amount, plan.currency)} ·&nbsp;
                  {expense.frequency}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div>Day: {expense.day ?? "—"}</div>
                <div>
                  Days: {expense.days.map((day) => day.day).join(", ") || "—"}
                </div>
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
          ))}
        </div>
      )}
    </main>
  )
}
