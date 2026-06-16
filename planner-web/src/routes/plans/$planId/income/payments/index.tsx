import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, ListTodo } from "lucide-react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { MarkReceivedDialog } from "@/features/income/components/mark-received-dialog"
import { planMutations } from "@/features/plans/data-access/plan.mutations"
import { planQueries } from "@/features/plans/data-access/plan.queries"
import { StatusActionMenu } from "@/features/plans/plan-actions"
import {
  EmptyState,
  ResourcePageSkeleton,
  StatusBadge,
} from "@/features/plans/plan-ui"
import { formatCurrency } from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute("/plans/$planId/income/payments/")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        planQueries.incomePaymentRefs(params.planId)
      ),
      context.queryClient.ensureQueryData(planQueries.accounts(params.planId)),
    ]),
  pendingComponent: ResourcePageSkeleton,
  component: IncomePaymentsListPage,
})

function IncomePaymentsListPage() {
  const { planId } = Route.useParams()
  const { data: payments } = useSuspenseQuery(
    planQueries.incomePaymentRefs(planId)
  )
  const { data: accounts } = useSuspenseQuery(planQueries.accounts(planId))
  const updateIncomePaymentStatusMutation = useMutation(
    planMutations.updateIncomePaymentStatus()
  )

  async function handleIncomePaymentStatusChange(
    incomePaymentId: string,
    status: "projected" | "received" | "cancelled",
    accountId?: string
  ) {
    try {
      await updateIncomePaymentStatusMutation.mutateAsync({
        incomePaymentId,
        planId,
        status,
        ...(accountId && { accountId }),
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
          <h1 className="text-2xl font-semibold">Income payments</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage individual payments and their status.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link params={{ planId }} to="/plans/$planId/income">
              <ArrowLeft />
              Back to income overview
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link params={{ planId }} to="/plans/$planId/income/payments/new">
              <ListTodo />
              New payment
            </Link>
          </Button>
        </div>
      </header>

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
                    {payment.status === "projected" ? (
                      <MarkReceivedDialog
                        accountId={payment.accountId ?? null}
                        accountName={payment.accountName ?? null}
                        accounts={accounts}
                        currency={payment.currency}
                        date={payment.date}
                        disabled={updateIncomePaymentStatusMutation.isPending}
                        amount={payment.amount}
                        onConfirm={({ accountId: selectedAccountId }) =>
                          handleIncomePaymentStatusChange(
                            payment.id,
                            "received",
                            selectedAccountId
                          )
                        }
                      />
                    ) : null}
                    <StatusActionMenu
                      actions={
                        payment.status === "projected"
                          ? [
                              {
                                confirmDescription: "Cancel income payment",
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
                      disabled={updateIncomePaymentStatusMutation.isPending}
                      onStatusChange={(status) =>
                        handleIncomePaymentStatusChange(payment.id, status)
                      }
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>Month: {payment.month}</div>
                <div>Source: {payment.source}</div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Account:</span>
                  {payment.accountName ? (
                    <span className="font-medium">{payment.accountName}</span>
                  ) : (
                    <span className="text-muted-foreground italic">
                      Not selected
                    </span>
                  )}
                </div>
                <div className="flex justify-end">
                  <Button asChild variant="outline" size="sm">
                    <Link
                      params={{
                        incomePaymentId: payment.id,
                        planId,
                      }}
                      to="/plans/$planId/income/payments/$incomePaymentId"
                    >
                      Edit full details
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
