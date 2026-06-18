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
  "/plans/$planId/income/payments/$incomePaymentId"
)({
  pendingComponent: ResourcePageSkeleton,
  component: EditIncomePaymentPage,
})

function EditIncomePaymentPage() {
  const { incomePaymentId, planId } = Route.useParams()

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Income Payment</h1>
          <p className="text-sm text-muted-foreground">
            Payment ID: {incomePaymentId}
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link params={{ planId }} to="/plans/$planId/income/payments">
            <ArrowLeft />
            Back to payments
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Income payment details</CardTitle>
          <CardDescription>
            Viewing and editing individual income payments is being updated for
            the new API structure.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Payment ID: {incomePaymentId}
          </p>
        </CardContent>
      </Card>
    </main>
  )
}
