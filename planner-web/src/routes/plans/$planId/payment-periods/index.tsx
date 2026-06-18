import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, CalendarPlus } from "lucide-react"

import { ResourceCard } from "@/components/resource-card"
import { ResourceList } from "@/components/resource-list"
import { Button } from "@/components/ui/button"
import { planQueries } from "@/features/plans/data-access/plan.queries"
import { EmptyState, ResourcePageSkeleton } from "@/features/plans/plan-ui"
import { formatCents } from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute(
  "/plans/$planId/payment-periods/"
)({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        planQueries.detail(params.planId)
      ),
      context.queryClient.ensureQueryData(
        planQueries.budgetPeriods(params.planId)
      ),
    ]),
  pendingComponent: ResourcePageSkeleton,
  component: BudgetPeriodsListPage,
})

function BudgetPeriodsListPage() {
  const { planId } = Route.useParams()
  const { data: plan } = useSuspenseQuery(planQueries.detail(planId))
  const { data: periods } = useSuspenseQuery(
    planQueries.budgetPeriods(planId)
  )
  const currency = plan.baseCurrency ?? "MXN"

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Budget periods</h1>
          <p className="text-sm text-muted-foreground">
            Planning windows for this plan.
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
              to="/plans/$planId/payment-periods/new"
            >
              <CalendarPlus />
              New period
            </Link>
          </Button>
        </div>
      </header>

       {periods.length === 0 ? (
         <EmptyState
           description="Create a budget period and then add budget items inside it."
           title="No budget periods yet"
         />
       ) : (
         <ResourceList>
           {periods.map((period) => (
             <ResourceCard
               key={period.id}
               title={`${period.periodType} · ${period.startsOn} to ${period.endsOn}`}
                description={`${period.status} · ${formatCents(period.fundingAmountCents ?? 0, currency)}`}
                metadata={[
                  {
                    label: "Start date",
                    value: period.startsOn ?? "—",
                  },
                  {
                    label: "End date",
                    value: period.endsOn ?? "—",
                  },
                  {
                    label: "Funding",
                    value: formatCents(period.fundingAmountCents ?? 0, currency),
                  },
                ]}
               actions={
                 <Button asChild variant="outline" size="sm">
                   <Link
                     params={{ periodId: period.id, planId }}
                     to="/plans/$planId/payment-periods/$periodId"
                   >
                     Open
                   </Link>
                 </Button>
               }
             />
           ))}
         </ResourceList>
       )}
    </main>
  )
}
