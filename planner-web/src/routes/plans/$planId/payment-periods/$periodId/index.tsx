import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Pencil, Plus } from "lucide-react"
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
import { StatusActionMenu } from "@/features/plans/plan-actions"
import {
  EmptyState,
  ResourcePageSkeleton,
  StatusBadge,
} from "@/features/plans/plan-ui"
import {
  describeReference,
  formatCurrency,
} from "@/features/plans/plan-ui.utils"
import { QuickCompleteDialog } from "@/features/plans/quick-complete-dialog"

export const Route = createFileRoute(
  "/plans/$planId/payment-periods/$periodId/"
)({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        planQueries.paymentPeriod(params.periodId)
      ),
      context.queryClient.ensureQueryData(planQueries.detail(params.planId)),
      context.queryClient.ensureQueryData(planQueries.accounts(params.planId)),
    ]),
  pendingComponent: ResourcePageSkeleton,
  component: PaymentPeriodDetailPage,
})

function PaymentPeriodDetailPage() {
  const { periodId, planId } = Route.useParams()
  const { data: period } = useSuspenseQuery(planQueries.paymentPeriod(periodId))
  const { data: plan } = useSuspenseQuery(planQueries.detail(planId))
  const { data: accounts } = useSuspenseQuery(planQueries.accounts(planId))
  const updatePaymentPeriodItemMutation = useMutation(
    planMutations.updatePaymentPeriodItem()
  )
  const completePaymentPeriodItemMutation = useMutation(
    planMutations.completePaymentPeriodItem()
  )

  async function handleCancelItem(itemId: string) {
    try {
      await updatePaymentPeriodItemMutation.mutateAsync({
        data: { status: "cancelled" },
        itemId,
        periodId,
        planId,
      })
      toast.success("Item cancelled.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to cancel item."
      )
    }
  }

  async function handleCompleteItem(
    itemId: string,
    actualAmount: number,
    accountId?: string
  ) {
    try {
      await completePaymentPeriodItemMutation.mutateAsync({
        data: {
          actualAmount,
          ...(accountId ? { accountId } : {}),
        },
        itemId,
        periodId,
        planId,
      })
      toast.success("Item completed.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to complete item."
      )
      throw error
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Payment period {period.incomeDate}
          </h1>
          <p className="text-sm text-muted-foreground">
            Review the planned items attached to this period.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link params={{ planId }} to="/plans/$planId/payment-periods">
              <ArrowLeft />
              Back to periods
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link
              params={{ periodId, planId }}
              to="/plans/$planId/payment-periods/$periodId/edit"
            >
              <Pencil />
              Edit period
            </Link>
          </Button>
          <Button asChild size="sm">
            <Link
              params={{ periodId, planId }}
              to="/plans/$planId/payment-periods/$periodId/items/new"
            >
              <Plus />
              New item
            </Link>
          </Button>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Planned total"
          value={formatCurrency(
            period.plannedTotal,
            period.incomePayment?.currency ?? plan.currency
          )}
        />
        <MetricCard
          label="Remaining planned"
          value={formatCurrency(
            period.plannedRemaining,
            period.incomePayment?.currency ?? plan.currency
          )}
        />
        <MetricCard label="Items" value={period.items.length.toString()} />
      </section>

      {period.items.length === 0 ? (
        <EmptyState
          description="Add your first planned item to this period."
          title="No items yet"
        />
      ) : (
        <div className="grid gap-4">
          {period.items.map((item) => (
            <Card key={item.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <CardTitle>{item.concept}</CardTitle>
                    <CardDescription>
                      {item.date} · planned&nbsp;
                      {formatCurrency(
                        item.plannedAmount,
                        period.incomePayment?.currency ?? plan.currency
                      )}
                    </CardDescription>
                  </div>
                  <StatusBadge value={item.status} />
                </div>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div>Category: {describeReference(item.category)}</div>
                <div>Account: {describeReference(item.account)}</div>
                <div>
                  Funding account: {describeReference(item.fundingAccount)}
                </div>
                <div className="flex flex-wrap justify-end gap-2">
                  {item.status === "pending" ? (
                    <QuickCompleteDialog
                      disabled={
                        updatePaymentPeriodItemMutation.isPending ||
                        completePaymentPeriodItemMutation.isPending
                      }
                      onComplete={({ actualAmount, accountId }) =>
                        handleCompleteItem(item.id, actualAmount, accountId)
                      }
                      plannedAmount={item.plannedAmount}
                      triggerLabel="Complete"
                      accountId={item.accountId ?? null}
                      accounts={accounts}
                    />
                  ) : null}
                  {item.status === "pending" ? (
                    <StatusActionMenu
                      actions={[
                        {
                          confirmDescription:
                            "This will cancel the planned item.",
                          confirmTitle: "Cancel item",
                          label: "Cancel",
                          targetStatus: "cancelled",
                          variant: "destructive",
                        },
                      ]}
                      disabled={
                        updatePaymentPeriodItemMutation.isPending ||
                        completePaymentPeriodItemMutation.isPending
                      }
                      onStatusChange={() => handleCancelItem(item.id)}
                    />
                  ) : null}
                  <Button asChild variant="outline" size="sm">
                    <Link
                      params={{ itemId: item.id, periodId, planId }}
                      to="/plans/$planId/payment-periods/$periodId/items/$itemId"
                    >
                      Edit item
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

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
    </div>
  )
}
