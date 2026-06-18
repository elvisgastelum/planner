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
  "/plans/$planId/payment-periods/$periodId/edit"
)({
  pendingComponent: ResourcePageSkeleton,
  component: EditBudgetPeriodPlaceholder,
})

function EditBudgetPeriodPlaceholder() {
  const { periodId, planId } = Route.useParams()

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link
            params={{ periodId, planId }}
            to="/plans/$planId/payment-periods/$periodId"
          >
            <ArrowLeft />
            Back to period
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Edit budget period</CardTitle>
          <CardDescription>
            Editing budget periods is not yet implemented. This feature will be
            available in a future update.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            To modify a budget period, please delete and recreate it with the
            correct details.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
