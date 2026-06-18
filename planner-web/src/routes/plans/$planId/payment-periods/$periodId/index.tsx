import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { planQueries } from "@/features/plans/data-access/plan.queries"
import {
  EmptyState,
  ResourcePageSkeleton,
} from "@/features/plans/plan-ui"
import { formatCents } from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute(
  "/plans/$planId/payment-periods/$periodId/"
)({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        planQueries.budgetPeriods(params.planId)
      ),
      context.queryClient.ensureQueryData(planQueries.detail(params.planId)),
    ]),
  pendingComponent: ResourcePageSkeleton,
  component: BudgetPeriodDetailPage,
})

function BudgetPeriodDetailPage() {
  const { periodId, planId } = Route.useParams()
  const { data: plan } = useSuspenseQuery(planQueries.detail(planId))
  const { data: periods } = useSuspenseQuery(planQueries.budgetPeriods(planId))
  const currency = plan.baseCurrency ?? "MXN"

  const period = periods.find((p: { id: string }) => p.id === periodId)

  if (!period) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
        <header className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link params={{ planId }} to="/plans/$planId/payment-periods">
              <ArrowLeft />
              Back to periods
            </Link>
          </Button>
        </header>
        <EmptyState
          description="Budget period not found."
          title="Period not found"
        />
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Budget period {period.periodType || period.id}
          </h1>
          <p className="text-sm text-muted-foreground">
            {period.startsOn} to {period.endsOn}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link params={{ planId }} to="/plans/$planId/payment-periods">
              <ArrowLeft />
              Back to periods
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link
              params={{ periodId, planId }}
              to="/plans/$planId/payment-periods/$periodId/items/new"
            >
              <Plus />
              New item
            </Link>
          </Button>
        </div>
      </header>

      {period.plannedTotalCents !== undefined && (
        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Planned total"
            value={formatCents(period.plannedTotalCents, currency)}
          />
          {period.unallocatedCents !== undefined && (
            <MetricCard
              label="Unallocated"
              value={formatCents(period.unallocatedCents, currency)}
            />
          )}
          <MetricCard label="Period ID" value={period.id} />
        </section>
      )}

      <EmptyState
        description="Budget items are not yet available in this view. Use the period list to manage items."
        title="Items view pending"
      />
    </main>
  )
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  )
}
