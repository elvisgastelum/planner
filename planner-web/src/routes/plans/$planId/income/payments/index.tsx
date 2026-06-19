import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { planQueries } from "@/features/plans/data-access/plan.queries"
import { EmptyState, ResourcePageSkeleton } from "@/features/plans/plan-ui"

export const Route = createFileRoute("/plans/$planId/income/payments/")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(planQueries.detail(params.planId)),
      context.queryClient.ensureQueryData(
        planQueries.incomePayments(params.planId)
      ),
    ]),
  pendingComponent: ResourcePageSkeleton,
  component: IncomePaymentsListPage,
})

function IncomePaymentsListPage() {
  const { planId } = Route.useParams()
  const { data: payments } = useSuspenseQuery(
    planQueries.incomePayments(planId)
  )

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Income payments</h1>
          <p className="text-sm text-muted-foreground">
            Manage individual payments.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link params={{ planId }} to="/plans/$planId/income">
              <ArrowLeft />
              Back to income
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link params={{ planId }} to="/plans/$planId/income/payments/new">
              <Plus />
              New payment
            </Link>
          </Button>
        </div>
      </header>

      {payments.length === 0 ? (
        <EmptyState
          description="Create a payment manually or generate projected payments."
          title="No income payments yet"
        />
      ) : (
        <div className="grid gap-4">
          {payments.map((payment) => (
            <div key={payment.id} className="rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Payment {payment.id}</h3>
                <span className="text-sm text-muted-foreground">
                  {payment.status}
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                {payment.paidOn ?? "No date"}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
