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
import { ResourcePageSkeleton } from "@/features/plans/plan-ui"

export const Route = createFileRoute(
  "/plans/$planId/payment-periods/$periodId/items/$itemId"
)({
  pendingComponent: ResourcePageSkeleton,
  component: BudgetItemDetailPage,
})

function BudgetItemDetailPage() {
  const { itemId, periodId, planId } = Route.useParams()

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Budget item</h1>
          <p className="text-sm text-muted-foreground">
            Item ID: {itemId}
          </p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link
              params={{ periodId, planId }}
              to="/plans/$planId/payment-periods/$periodId"
            >
              <ArrowLeft />
              Back to period
            </Link>
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Budget item details</CardTitle>
          <CardDescription>
            Viewing and editing individual budget items is not yet fully
            implemented. The item will be displayed here once the feature is
            available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Item ID: {itemId}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            To manage budget items, please use the period view to see all items.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
