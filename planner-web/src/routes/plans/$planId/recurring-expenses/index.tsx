import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Plus } from "lucide-react"

import { ResourceCard } from "@/components/resource-card"
import { ResourceList } from "@/components/resource-list"
import { Button } from "@/components/ui/button"
import { planQueries } from "@/features/plans/data-access/plan.queries"
import { EmptyState, ResourcePageSkeleton } from "@/features/plans/plan-ui"
import { formatCents } from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute("/plans/$planId/recurring-expenses/")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(planQueries.detail(params.planId)),
      context.queryClient.ensureQueryData(
        planQueries.recurringItems(params.planId)
      ),
    ]),
  pendingComponent: ResourcePageSkeleton,
  component: RecurringItemsListPage,
})

function RecurringItemsListPage() {
  const { planId } = Route.useParams()
  const { data: plan } = useSuspenseQuery(planQueries.detail(planId))
  const { data: items } = useSuspenseQuery(planQueries.recurringItems(planId))

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Recurring items</h1>
          <p className="text-sm text-muted-foreground">
            Periodic items for this plan.
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
              New item
            </Link>
          </Button>
        </div>
      </header>

      {items.length === 0 ? (
        <EmptyState
          description="Create your first recurring item to start planning."
          title="No recurring items yet"
        />
      ) : (
        <ResourceList>
          {items.map((item) => (
            <ResourceCard
              key={item.id}
              title={item.concept ?? item.id}
              description={`${formatCents(item.amountCents ?? 0, plan.baseCurrency ?? "MXN")} · ${item.itemType}`}
              metadata={[
                {
                  label: "Active",
                  value: item.active ? "Yes" : "No",
                },
                {
                  label: "Recurrence",
                  value: item.recurrenceRule ?? "—",
                },
              ]}
              actions={
                <Button asChild variant="outline" size="sm">
                  <Link
                    params={{ planId, recurringExpenseId: item.id }}
                    to="/plans/$planId/recurring-expenses/$recurringExpenseId"
                  >
                    Edit
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
