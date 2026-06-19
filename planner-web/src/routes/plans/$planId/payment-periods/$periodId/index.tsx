import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Pencil, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { planQueries } from "@/features/plans/data-access/plan.queries"
import { ResourcePageSkeleton } from "@/features/plans/plan-ui"
import { formatCents, formatDateLabel } from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute(
  "/plans/$planId/payment-periods/$periodId/"
)({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        planQueries.budgetPeriods(params.planId)
      ),
      context.queryClient.ensureQueryData(planQueries.detail(params.planId)),
      context.queryClient.ensureQueryData(
        planQueries.budgetItems(params.planId, params.periodId)
      ),
    ]),
  pendingComponent: ResourcePageSkeleton,
  component: BudgetPeriodDetailPage,
})

function BudgetPeriodDetailPage() {
  const { periodId, planId } = Route.useParams()
  const { data: plan } = useSuspenseQuery(planQueries.detail(planId))
  const { data: periods } = useSuspenseQuery(planQueries.budgetPeriods(planId))
  const { data: items } = useSuspenseQuery(
    planQueries.budgetItems(planId, periodId)
  )
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
            {formatDateLabel(period.startsOn)} to&nbsp;
            {formatDateLabel(period.endsOn)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link params={{ planId }} to="/plans/$planId/payment-periods">
              <ArrowLeft />
              Back to periods
            </Link>
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link
              params={{ periodId, planId }}
              to="/plans/$planId/payment-periods/$periodId/edit"
            >
              <Pencil />
              Edit period
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

      {period.fundingAmountCents !== undefined && (
        <section className="grid gap-4 md:grid-cols-3">
          <MetricCard
            label="Funding amount"
            value={formatCents(period.fundingAmountCents, currency)}
          />
          {period.plannedTotalCents !== undefined && (
            <MetricCard
              label="Planned total"
              value={formatCents(period.plannedTotalCents, currency)}
            />
          )}
          {period.unallocatedCents !== undefined && (
            <MetricCard
              label="Unallocated"
              value={formatCents(period.unallocatedCents, currency)}
            />
          )}
        </section>
      )}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Budget Items</h2>
        {items.length === 0 ? (
          <EmptyState
            description="No budget items yet. Create one to start tracking expenses."
            title="No items"
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item) => (
              <Card key={item.id}>
                <CardHeader>
                  <CardTitle className="text-lg">{item.concept}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Planned:</span>
                      <span className="text-sm">
                        {formatCents(item.plannedAmountCents, currency)}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm font-medium">Status:</span>
                      <span className="text-sm">{item.status}</span>
                    </div>
                    {item.dueOn && (
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">Due:</span>
                        <span className="text-sm">
                          {formatDateLabel(item.dueOn)}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 flex gap-2">
                    <Button asChild size="sm" variant="outline">
                      <Link
                        params={{ itemId: item.id, periodId, planId }}
                        to="/plans/$planId/payment-periods/$periodId/items/$itemId"
                      >
                        View
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
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

function EmptyState({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  )
}
