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
  "/plans/$planId/payment-periods/$periodId/items/$itemId/complete"
)({
  pendingComponent: ResourcePageSkeleton,
  component: CompleteItemPlaceholder,
})

function CompleteItemPlaceholder() {
  const { itemId, periodId, planId } = Route.useParams()

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link
            params={{ itemId, periodId, planId }}
            to="/plans/$planId/payment-periods/$periodId/items/$itemId"
          >
            <ArrowLeft />
            Back to item
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Complete item</CardTitle>
          <CardDescription>
            Direct item completion is no longer supported. Fulfillment now
            happens via transactions and budget allocations.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            To mark an item as fulfilled, please create a transaction linked to
            this budget item or use the budget allocation workflow.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
