import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { planQueries } from "@/features/plans/data-access/plan.queries"
import { ResourcePageSkeleton } from "@/features/plans/plan-ui"

export const Route = createFileRoute("/plans/$planId/categories/allocations")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(planQueries.categories(params.planId)),
  pendingComponent: ResourcePageSkeleton,
  component: CategoryAllocationsPage,
})

function CategoryAllocationsPage() {
  const { planId } = Route.useParams()
  const { data: categories } = useSuspenseQuery(
    planQueries.categories(planId)
  )

  if (categories.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Category allocations</h1>
            <p className="text-sm text-muted-foreground">
              View ideal percentage allocations across all categories.
            </p>
          </div>
          <Button asChild variant="ghost" size="sm">
            <Link params={{ planId }} to="/plans/$planId/categories">
              <ArrowLeft />
              Back to categories
            </Link>
          </Button>
        </header>
        <Card>
          <CardContent className="py-8 text-center">
            <p className="mb-4 text-sm text-muted-foreground">
              No categories found. Create categories before viewing
              allocations.
            </p>
            <Button asChild size="sm">
              <Link params={{ planId }} to="/plans/$planId/categories/new">
                Create a category
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    )
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Category allocations</h1>
          <p className="text-sm text-muted-foreground">
            View ideal percentage allocations across all categories. To edit
            allocations, please edit each category individually.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link params={{ planId }} to="/plans/$planId/categories">
            <ArrowLeft />
            Back to categories
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Allocation percentages</CardTitle>
          <CardDescription>
            Each category's ideal percentage (in basis points, 10000 = 100%).
            Edit individual categories to update their allocation.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {categories.map((cat) => (
              <div
                className="grid grid-cols-[1fr_auto] items-center gap-3"
                key={cat.id}
              >
                 <div className="min-w-0">
                   <p className="truncate text-sm font-medium">{cat.name}</p>
                   <p className="text-xs text-muted-foreground">{cat.code}</p>
                 </div>
                <div className="text-sm tabular-nums">
                  {cat.idealPercentageBps !== undefined
                    ? `${cat.idealPercentageBps} bps (${(cat.idealPercentageBps / 100).toFixed(2)}%)`
                    : "Not set"}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
