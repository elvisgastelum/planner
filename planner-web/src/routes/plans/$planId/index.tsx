import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute } from "@tanstack/react-router"

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { planQueries } from "@/features/plans/data-access/plan.queries"
import {
  EmptyState,
  PlanOverviewSkeleton,
  StatusBadge,
} from "@/features/plans/plan-ui"

export const Route = createFileRoute("/plans/$planId/")({
  loader: ({ context, params }) => {
    context.queryClient.ensureQueryData(planQueries.detail(params.planId))
  },
  pendingComponent: PlanOverviewSkeleton,
  component: RouteComponent,
})

function RouteComponent() {
  const { planId } = Route.useParams()
  const { data: plan } = useSuspenseQuery(planQueries.detail(planId))

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{plan.name}</h1>
            <StatusBadge value={plan.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {plan.baseCurrency ?? "USD"} · starts {plan.startDate}
          </p>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Plan details</CardTitle>
            <CardDescription>
              Metadata and summary information for this plan.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <DetailRow label="Plan ID" value={plan.id} />
              <DetailRow label="Status" value={plan.status} />
              <DetailRow label="Base currency" value={plan.baseCurrency} />
              <DetailRow label="Start date" value={plan.startDate} />
              <DetailRow
                label="End date"
                value={plan.endDate ?? "Open-ended"}
              />
              <DetailRow
                className="sm:col-span-2"
                label="Objective"
                value={plan.objective ?? "No objective set"}
              />
            </dl>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <EmptyState
            description="Use the linked workspaces to add accounts, income, budget periods, and recurring items to this plan."
            title="Plan workspaces"
          />
        </div>
      </section>
    </main>
  )
}

function DetailRow({
  label,
  value,
  className,
}: {
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={className}>
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value}</dd>
    </div>
  )
}
