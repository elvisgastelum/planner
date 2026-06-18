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
  "/plans/$planId/recurring-expenses/$recurringExpenseId"
)({
  pendingComponent: ResourcePageSkeleton,
  component: RecurringItemDetailPage,
})

function RecurringItemDetailPage() {
  const { recurringExpenseId, planId } = Route.useParams()

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Recurring item</h1>
          <p className="text-sm text-muted-foreground">
            Item ID: {recurringExpenseId}
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link params={{ planId }} to="/plans/$planId/recurring-expenses">
            <ArrowLeft />
            Back to recurring items
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Recurring item details</CardTitle>
          <CardDescription>
            Viewing and editing individual recurring items is not yet fully
            implemented. The item will be displayed here once the feature is
            available.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Item ID: {recurringExpenseId}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            To manage recurring items, please use the list view.
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
