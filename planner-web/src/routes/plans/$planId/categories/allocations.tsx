import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Save } from "lucide-react"
import { useMemo, useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { planMutations } from "@/features/plans/data-access/plan.mutations"
import { planQueries } from "@/features/plans/data-access/plan.queries"
import { FormError, ResourcePageSkeleton } from "@/features/plans/plan-ui"
import { toOptionalNumber } from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute("/plans/$planId/categories/allocations")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      planQueries.categoriesLight(params.planId)
    ),
  pendingComponent: ResourcePageSkeleton,
  component: CategoryAllocationsPage,
})

type AllocationRow = {
  id: string
  key: string
  name: string
  idealPercentage: number
}

function CategoryAllocationsPage() {
  const { planId } = Route.useParams()
  const navigate = useNavigate()
  const { data: categories } = useSuspenseQuery(
    planQueries.categoriesLight(planId)
  )

  const [rows, setRows] = useState<AllocationRow[]>(() =>
    categories.map((cat) => ({
      id: cat.id,
      key: cat.key,
      name: cat.name,
      idealPercentage: cat.idealPercentage,
    }))
  )

  const bulkUpdateMutation = useMutation(
    planMutations.bulkUpdateCategoryPercentages()
  )

  const totalPercentage = useMemo(
    () => rows.reduce((sum, row) => sum + row.idealPercentage, 0),
    [rows]
  )

  const tolerance = 0.01
  const isTotalValid =
    rows.length > 0 && Math.abs(totalPercentage - 100) < tolerance
  const remaining = 100 - totalPercentage

  function updateRowPercentage(index: number, value: string) {
    const numValue = toOptionalNumber(value)
    setRows((current) => {
      const updated = [...current]
      updated[index] = {
        ...updated[index],
        idealPercentage: numValue ?? 0,
      }
      return updated
    })
  }

  function handleReset() {
    setRows(
      categories.map((cat) => ({
        id: cat.id,
        key: cat.key,
        name: cat.name,
        idealPercentage: cat.idealPercentage,
      }))
    )
  }

  async function handleSave() {
    if (!isTotalValid) {
      toast.error("Total percentage must equal 100%.")
      return
    }

    try {
      await bulkUpdateMutation.mutateAsync({
        data: {
          categories: rows.map((row) => ({
            categoryId: row.id,
            idealPercentage: row.idealPercentage,
          })),
        },
        planId,
      })
      toast.success("Category percentages updated.")
      await navigate({
        params: { planId },
        to: "/plans/$planId/categories",
      })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update percentages."
      )
    }
  }

  if (categories.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Category allocations</h1>
            <p className="text-sm text-muted-foreground">
              Adjust ideal percentage allocations across all categories.
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
              No categories found. Create categories before adjusting
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
            Adjust ideal percentage allocations across all categories. Total
            must equal 100%.
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
            Update the ideal percentage for each category. The total must equal
            100%.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            {rows.map((row, index) => (
              <div
                className="grid grid-cols-[1fr_2fr_auto] items-center gap-3"
                key={row.id}
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{row.name}</p>
                  <p className="text-xs text-muted-foreground">{row.key}</p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    aria-label={`Percentage for ${row.name}`}
                    className="w-full rounded-md border bg-background px-3 py-2 text-sm tabular-nums"
                    max="100"
                    min="0"
                    onChange={(event) =>
                      updateRowPercentage(index, event.currentTarget.value)
                    }
                    step="0.01"
                    type="number"
                    value={row.idealPercentage}
                  />
                  <span className="text-sm text-muted-foreground">%</span>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t pt-4">
            <div className="flex items-center justify-between text-sm">
              <span>Total</span>
              <span
                className={isTotalValid ? "text-green-600" : "text-destructive"}
              >
                {totalPercentage.toFixed(2)}%
              </span>
            </div>
            {!isTotalValid && (
              <p aria-live="polite" className="text-sm text-destructive">
                {remaining > 0
                  ? `${remaining.toFixed(2)}% remaining to reach 100%`
                  : `${Math.abs(remaining).toFixed(2)}% over 100%`}
              </p>
            )}
          </div>

          <FormError error={bulkUpdateMutation.error} />

          <div className="flex flex-wrap gap-2 border-t pt-4">
            <Button
              disabled={!isTotalValid || bulkUpdateMutation.isPending}
              onClick={() => void handleSave()}
              type="button"
            >
              <Save />
              {bulkUpdateMutation.isPending ? "Saving..." : "Save"}
            </Button>
            <Button
              disabled={bulkUpdateMutation.isPending}
              onClick={handleReset}
              type="button"
              variant="outline"
            >
              Reset
            </Button>
            <Button
              asChild
              disabled={bulkUpdateMutation.isPending}
              type="button"
              variant="ghost"
            >
              <Link params={{ planId }} to="/plans/$planId/categories">
                Cancel
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
