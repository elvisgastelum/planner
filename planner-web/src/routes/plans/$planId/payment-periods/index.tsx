import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, CalendarPlus, Pencil } from "lucide-react"

import { ResourceCard } from "@/components/resource-card"
import { ResourceList } from "@/components/resource-list"
import { Button } from "@/components/ui/button"
import { planQueries } from "@/features/plans/data-access/plan.queries"
import { EmptyState, ResourcePageSkeleton } from "@/features/plans/plan-ui"
import { formatCurrency } from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute("/plans/$planId/payment-periods/")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        planQueries.paymentPeriods(params.planId)
      ),
      context.queryClient.ensureQueryData(
        planQueries.incomePaymentRefs(params.planId)
      ),
    ]),
  pendingComponent: ResourcePageSkeleton,
  component: PaymentPeriodsListPage,
})

function PaymentPeriodsListPage() {
  const { planId } = Route.useParams()
  const { data: plan } = useSuspenseQuery(planQueries.detail(planId))
  const { data: paymentPeriods } = useSuspenseQuery(
    planQueries.paymentPeriods(planId)
  )

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Payment periods</h1>
          <p className="text-sm text-muted-foreground">
            Read-only list of planning windows.
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
            <Link params={{ planId }} to="/plans/$planId/payment-periods/new">
              <CalendarPlus />
              New period
            </Link>
          </Button>
        </div>
      </header>

      {paymentPeriods.length === 0 ? (
        <EmptyState
          description="Create a period and then add planned items inside it."
          title="No payment periods yet"
        />
      ) : (
        <ResourceList>
          {paymentPeriods.map((period) => (
            <ResourceCard
              key={period.id}
              title={period.incomeDate}
              description={period.externalId ?? "No external ID"}
              metadata={[
                {
                  label: "Planned total",
                  value: formatCurrency(
                    period.plannedTotal,
                    period.incomePayment?.currency ?? plan.currency
                  ),
                },
                {
                  label: "Remaining planned",
                  value: formatCurrency(
                    period.plannedRemaining,
                    period.incomePayment?.currency ?? plan.currency
                  ),
                },
                {
                  label: "Items",
                  value: period.itemsCount,
                },
                {
                  label: "Income payment",
                  value: period.incomePayment
                    ? `${period.incomePayment.date} · ${formatCurrency(period.incomePayment.amount, period.incomePayment.currency)}`
                    : "Unlinked",
                },
              ]}
              actions={
                <>
                  <Button asChild variant="outline" size="sm">
                    <Link
                      params={{ periodId: period.id, planId }}
                      to="/plans/$planId/payment-periods/$periodId"
                    >
                      Open
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <Link
                      params={{ periodId: period.id, planId }}
                      to="/plans/$planId/payment-periods/$periodId/edit"
                    >
                      <Pencil />
                      Edit
                    </Link>
                  </Button>
                </>
              }
            />
          ))}
        </ResourceList>
      )}
    </main>
  )
}
