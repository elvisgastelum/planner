import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import {
  ArrowDownToLine,
  CalendarDays,
  Landmark,
  Pencil,
  Repeat,
  Tag,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { planQueries } from "@/features/plans/data-access/plan.queries"
import {
  DetailRow,
  EmptyState,
  MetricCard,
  PlanOverviewSkeleton,
  StatusBadge,
} from "@/features/plans/plan-ui"
import { formatCurrency } from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute("/plans/$planId/")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(planQueries.overview(params.planId)),
  pendingComponent: PlanOverviewSkeleton,
  component: RouteComponent,
})

function RouteComponent() {
  const { planId } = Route.useParams()
  const { data: overview } = useSuspenseQuery(planQueries.overview(planId))

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{overview.name}</h1>
            <StatusBadge value={overview.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {overview.currency} · starts {overview.startDate}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <nav className="flex flex-wrap gap-2 text-sm">
            <Button asChild variant="outline" size="sm">
              <Link
                params={{ planId: overview.id }}
                to="/plans/$planId/accounts"
              >
                <Landmark />
                Accounts
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link
                params={{ planId: overview.id }}
                to="/plans/$planId/categories"
              >
                <Tag />
                Categories
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link params={{ planId: overview.id }} to="/plans/$planId/income">
                <ArrowDownToLine />
                Income
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link
                params={{ planId: overview.id }}
                to="/plans/$planId/payment-periods"
              >
                <CalendarDays />
                Payment periods
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link
                params={{ planId: overview.id }}
                to="/plans/$planId/recurring-expenses"
              >
                <Repeat />
                Recurring expenses
              </Link>
            </Button>
          </nav>
          <Button asChild variant="outline">
            <Link params={{ planId: overview.id }} to="/plans/$planId/edit">
              <Pencil />
              Edit plan
            </Link>
          </Button>
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Planned total"
          value={formatCurrency(overview.plannedTotal, overview.currency)}
        />
        <MetricCard
          label="Remaining planned"
          value={formatCurrency(overview.plannedRemaining, overview.currency)}
        />
        <MetricCard
          label="Completed total"
          value={formatCurrency(overview.completedTotal, overview.currency)}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Accounts"
          value={overview.accountsCount.toString()}
        />
        <MetricCard
          label="Income payments"
          value={overview.incomePaymentsCount.toString()}
        />
        <MetricCard
          label="Payment periods"
          value={overview.paymentPeriodsCount.toString()}
        />
        <MetricCard
          label="Recurring expenses"
          value={overview.recurringExpensesCount.toString()}
        />
        <MetricCard
          label="Completed items"
          value={overview.completedItemsCount.toString()}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Plan details</CardTitle>
            <CardDescription>
              Metadata and calculated summary information for this plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailRow label="Metadata ID" value={overview.metadataId} />
              <DetailRow label="Status" value={overview.status} />
              <DetailRow label="Start date" value={overview.startDate} />
              <DetailRow
                label="End date"
                value={overview.endDate ?? "Open-ended"}
              />
              <DetailRow
                className="sm:col-span-2"
                label="Objective"
                value={overview.objective ?? "No objective set"}
              />
              <DetailRow
                label="Projected debt-free date"
                value={overview.projectedDebtFreeDate ?? "Not calculated"}
              />
              <DetailRow
                label="Projected emergency fund"
                value={
                  overview.projectedEmergencyFund === null
                    ? "Not calculated"
                    : formatCurrency(
                        overview.projectedEmergencyFund,
                        overview.currency
                      )
                }
              />
            </dl>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Next income date</CardTitle>
            </CardHeader>
            <CardContent className="text-lg font-medium">
              {overview.nextIncomeDate ?? "No upcoming income payment"}
            </CardContent>
          </Card>
          <EmptyState
            description="Use the linked workspaces to add accounts, income, payment periods, and recurring expenses to this plan."
            title="Plan workspaces"
          />
        </div>
      </section>
    </main>
  )
}
