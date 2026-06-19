import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { planQueries } from "@/features/plans/data-access/plan.queries"
import { EmptyState, ResourcePageSkeleton } from "@/features/plans/plan-ui"

export const Route = createFileRoute("/plans/$planId/income/schedule")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(planQueries.detail(params.planId)),
      context.queryClient.ensureQueryData(
        planQueries.incomeSources(params.planId)
      ),
    ]),
  pendingComponent: ResourcePageSkeleton,
  component: IncomeSourcesPage,
})

function IncomeSourcesPage() {
  const { planId } = Route.useParams()
  const { data: plan } = useSuspenseQuery(planQueries.detail(planId))
  const { data: sources } = useSuspenseQuery(planQueries.incomeSources(planId))

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Income sources</h1>
          <p className="text-sm text-muted-foreground">
            Manage income sources and their schedules.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link params={{ planId }} to="/plans/$planId/income">
              <ArrowLeft />
              Back to income
            </Link>
          </Button>
        </div>
      </header>

      {sources.length === 0 ? (
        <EmptyState
          description="Create your first income source to start planning."
          title="No income sources yet"
        />
      ) : (
        <div className="grid gap-4">
          {sources.map((source) => (
            <div key={source.id} className="rounded-lg border p-4">
              <h3 className="font-medium">{source.name}</h3>
              <p className="text-sm text-muted-foreground">
                {source.currency ?? plan.baseCurrency ?? "USD"}
                {source.defaultDepositAccountId
                  ? ` · Account: ${source.defaultDepositAccountId}`
                  : ""}
              </p>
            </div>
          ))}
        </div>
      )}
    </main>
  )
}
