import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { planQueries } from "@/features/plans/data-access/plan.queries"
import { ResourcePageSkeleton } from "@/features/plans/plan-ui"

export const Route = createFileRoute("/plans/$planId/income/")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(planQueries.detail(params.planId)),
      context.queryClient.ensureQueryData(
        planQueries.incomeSources(params.planId)
      ),
      context.queryClient.ensureQueryData(
        planQueries.incomePayments(params.planId)
      ),
    ]),
  pendingComponent: ResourcePageSkeleton,
  component: IncomeIndexPage,
})

function IncomeIndexPage() {
  const { planId } = Route.useParams()
  const { data: sources } = useSuspenseQuery(
    planQueries.incomeSources(planId)
  )
  const { data: payments } = useSuspenseQuery(
    planQueries.incomePayments(planId)
  )

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Income</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of income sources and payments.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link params={{ planId }} to="/plans/$planId">
              <ArrowLeft />
              Back to plan
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Income sources</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{sources.length}</p>
            <p className="text-xs text-muted-foreground">
              Total sources
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Income payments</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{payments.length}</p>
            <p className="text-xs text-muted-foreground">
              Total payments
            </p>
          </CardContent>
        </Card>
      </section>

      <div className="flex flex-wrap gap-2">
        <Button asChild size="sm">
          <Link params={{ planId }} to="/plans/$planId/income/schedule">
            <Plus />
            Manage sources
          </Link>
        </Button>
        <Button asChild size="sm" variant="outline">
          <Link params={{ planId }} to="/plans/$planId/income/payments">
            View payments
          </Link>
        </Button>
      </div>
    </main>
  )
}
