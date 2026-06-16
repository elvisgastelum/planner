import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, CalendarPlus, ListTodo, Pencil, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { planMutations } from "@/features/plans/data-access/plan.mutations"
import { planQueries } from "@/features/plans/data-access/plan.queries"
import {
  FieldShell,
  FormError,
  ResourcePageSkeleton,
} from "@/features/plans/plan-ui"
import { formatCurrency } from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute("/plans/$planId/income/")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        planQueries.incomePaymentsSummary(params.planId)
      ),
      context.queryClient.ensureQueryData(
        planQueries.incomeSchedule(params.planId)
      ),
    ]),
  pendingComponent: ResourcePageSkeleton,
  component: IncomeIndexPage,
})

function IncomeIndexPage() {
  const { planId } = Route.useParams()
  const { data: summary } = useSuspenseQuery(
    planQueries.incomePaymentsSummary(planId)
  )
  const { data: schedule } = useSuspenseQuery(
    planQueries.incomeSchedule(planId)
  )
  const [generateThrough, setGenerateThrough] = useState("")
  const generatePaymentsMutation = useMutation(
    planMutations.generateIncomePayments()
  )

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Income</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Overview of schedule, summary, and payment generation.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link params={{ planId }} to="/plans/$planId">
              <ArrowLeft />
              Back to plan
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link params={{ planId }} to="/plans/$planId/income/payments">
              <ListTodo />
              View payments
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link params={{ planId }} to="/plans/$planId/income/schedule">
              <Pencil />
              Edit schedule
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link params={{ planId }} to="/plans/$planId/income/payments/new">
              <Plus />
              New payment
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Projected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalProjected, "MXN")}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.projectedCount} payment
              {summary.projectedCount !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Received
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalReceived, "MXN")}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.receivedCount} payment
              {summary.receivedCount !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Cancelled
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(summary.totalCancelled, "MXN")}
            </div>
            <p className="text-xs text-muted-foreground">
              {summary.cancelledCount} payment
              {summary.cancelledCount !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Next projected
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {summary.nextProjectedPaymentDate ?? "—"}
            </div>
            <p className="text-xs text-muted-foreground">Upcoming payment</p>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Schedule</CardTitle>
            <CardDescription>Current cadence and rule setup.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            {schedule ? (
              <>
                <div>Cadence: {schedule.cadence}</div>
                <div>Anchor date: {schedule.anchorPaymentDate}</div>
                <div>Currency: {schedule.currency}</div>
                <div>Amount rules: {schedule.amountRules.length}</div>
              </>
            ) : (
              <div className="text-muted-foreground">No schedule yet.</div>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Generate payments</CardTitle>
            <CardDescription>
              Create projected payments through a target date.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <FieldShell label="Generate through">
              <DatePicker
                onChange={setGenerateThrough}
                required
                value={generateThrough}
              />
            </FieldShell>
            <FormError error={generatePaymentsMutation.error} />
            <Button
              disabled={
                generatePaymentsMutation.isPending ||
                !schedule ||
                !generateThrough
              }
              onClick={() =>
                void (async () => {
                  try {
                    await generatePaymentsMutation.mutateAsync({
                      data: { through: generateThrough },
                      planId,
                    })
                    toast.success("Income payments generated.")
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Failed to generate income payments."
                    )
                  }
                })()
              }
              type="button"
            >
              <CalendarPlus />
              {generatePaymentsMutation.isPending
                ? "Generating..."
                : "Generate"}
            </Button>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
