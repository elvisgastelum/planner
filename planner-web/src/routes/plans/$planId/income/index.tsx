import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, CalendarPlus, Pencil, Plus } from "lucide-react"
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
import { StatusActionMenu } from "@/features/plans/plan-actions"
import {
  EmptyState,
  FieldShell,
  FormError,
  ResourcePageSkeleton,
  StatusBadge,
} from "@/features/plans/plan-ui"
import { formatCurrency } from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute("/plans/$planId/income/")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(planQueries.detail(params.planId)),
      context.queryClient.ensureQueryData(
        planQueries.incomeSchedule(params.planId)
      ),
      context.queryClient.ensureQueryData(
        planQueries.incomePayments(params.planId)
      ),
    ]),
  pendingComponent: ResourcePageSkeleton,
  component: IncomeIndexPage,
})

function IncomeIndexPage() {
  const { planId } = Route.useParams()
  const { data: plan } = useSuspenseQuery(planQueries.detail(planId))
  const { data: schedule } = useSuspenseQuery(
    planQueries.incomeSchedule(planId)
  )
  const { data: payments } = useSuspenseQuery(
    planQueries.incomePayments(planId)
  )
  const [generateThrough, setGenerateThrough] = useState("")
  const generatePaymentsMutation = useMutation(
    planMutations.generateIncomePayments()
  )
  const updateIncomePaymentMutation = useMutation(
    planMutations.updateIncomePayment()
  )

  async function handleIncomePaymentStatusChange(
    incomePaymentId: string,
    status: "projected" | "received" | "cancelled"
  ) {
    try {
      await updateIncomePaymentMutation.mutateAsync({
        data: { status },
        incomePaymentId,
        planId,
      })
      toast.success(`Income payment updated to ${status}.`)
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to update income payment."
      )
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Income</h1>
            <StatusBadge value={plan.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage the schedule, generated payments, and manual corrections.
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

      <section className="grid gap-4 md:grid-cols-3">
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
        <Card>
          <CardHeader>
            <CardTitle>Plan totals</CardTitle>
            <CardDescription>
              Quick overview for this workspace.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <div>Total payments: {payments.length}</div>
            <div>Plan currency: {plan.currency}</div>
            <div>Start date: {plan.startDate}</div>
          </CardContent>
        </Card>
      </section>

      {payments.length === 0 ? (
        <EmptyState
          description="Create a payment manually or generate projected payments from the schedule."
          title="No income payments yet"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {payments.map((payment) => (
            <Card key={payment.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>
                      {formatCurrency(payment.amount, payment.currency)}
                    </CardTitle>
                    <CardDescription>{payment.date}</CardDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge value={payment.status} />
                    <StatusBadge value={payment.source} />
                    <StatusActionMenu
                      actions={
                        payment.status === "projected"
                          ? [
                              {
                                label: "Mark received",
                                targetStatus: "received",
                              },
                              {
                                confirmDescription:
                                  "This will cancel the projected income payment.",
                                confirmTitle: "Cancel income payment",
                                label: "Cancel",
                                targetStatus: "cancelled",
                                variant: "destructive",
                              },
                            ]
                          : payment.status === "received"
                            ? [
                                {
                                  label: "Revert to projected",
                                  targetStatus: "projected",
                                },
                                {
                                  confirmDescription:
                                    "This will cancel the received income payment.",
                                  confirmTitle: "Cancel income payment",
                                  label: "Cancel",
                                  targetStatus: "cancelled",
                                  variant: "destructive",
                                },
                              ]
                            : [
                                {
                                  label: "Reopen as projected",
                                  targetStatus: "projected",
                                },
                              ]
                      }
                      disabled={updateIncomePaymentMutation.isPending}
                      onStatusChange={(status) =>
                        handleIncomePaymentStatusChange(payment.id, status)
                      }
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>External ID: {payment.externalId ?? "—"}</div>
                <div>Month: {payment.month}</div>
                <div>Payment number: {payment.paymentNumberInMonth}</div>
                <div className="flex justify-end">
                  <Button asChild variant="outline" size="sm">
                    <Link
                      params={{ incomePaymentId: payment.id, planId }}
                      to="/plans/$planId/income/payments/$incomePaymentId"
                    >
                      <Pencil />
                      Edit
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
