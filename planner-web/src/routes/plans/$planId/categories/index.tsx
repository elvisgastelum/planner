import { useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Pencil, Plus } from "lucide-react"

import { ResourceCard } from "@/components/resource-card"
import { ResourceList } from "@/components/resource-list"
import { Button } from "@/components/ui/button"
import { planQueries } from "@/features/plans/data-access/plan.queries"
import { EmptyState, ResourcePageSkeleton } from "@/features/plans/plan-ui"

export const Route = createFileRoute("/plans/$planId/categories/")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(planQueries.categories(params.planId)),
  pendingComponent: ResourcePageSkeleton,
  component: CategoriesListPage,
})

function CategoriesListPage() {
  const { planId } = Route.useParams()
  const { data: categories } = useSuspenseQuery(planQueries.categories(planId))

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Read-only allocation category list. Open one to edit it.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link params={{ planId }} to="/plans/$planId">
              <ArrowLeft />
              Back to dashboard
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link params={{ planId }} to="/plans/$planId/categories/new">
              <Plus />
              New category
            </Link>
          </Button>
        </div>
      </header>

      {categories.length === 0 ? (
        <EmptyState
          description="Create your first category to organize planned spending."
          title="No categories yet"
        />
      ) : (
        <ResourceList>
          {categories.map((category) => (
            <ResourceCard
              key={category.id}
              title={category.name}
              description={`${category.key} · ${category.percentage}%`}
              metadata={[
                {
                  label: "Description",
                  value: category.description || "No description",
                },
              ]}
              actions={
                <Button asChild variant="outline" size="sm">
                  <Link
                    params={{ categoryId: category.id, planId }}
                    to="/plans/$planId/categories/$categoryId"
                  >
                    <Pencil />
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
