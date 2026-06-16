import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Sparkles } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { planMutations } from "@/features/plans/data-access/plan.mutations"
import { planQueries } from "@/features/plans/data-access/plan.queries"
import {
  FieldShell,
  FormError,
  ResourcePageSkeleton,
  TextField,
} from "@/features/plans/plan-ui"
import {
  describeReference,
  readText,
  toOptionalPositiveNumber,
  toOptionalString,
} from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute(
  "/plans/$planId/payment-periods/$periodId/items/$itemId/complete"
)({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        planQueries.paymentPeriodItem(params.itemId)
      ),
      context.queryClient.ensureQueryData(planQueries.accounts(params.planId)),
    ]),
  pendingComponent: ResourcePageSkeleton,
  component: CompletePaymentPeriodItemPage,
})

function CompletePaymentPeriodItemPage() {
  const navigate = useNavigate()
  const { itemId, periodId, planId } = Route.useParams()
  const { data: item } = useSuspenseQuery(planQueries.paymentPeriodItem(itemId))
  const { data: accounts } = useSuspenseQuery(planQueries.accounts(planId))
  const completeMutation = useMutation(
    planMutations.completePaymentPeriodItem()
  )
  const [form, setForm] = useState({
    actualAmount: readText(item.actualAmount) || item.plannedAmount.toString(),
    notes: readText(item.notes),
    accountId: item.accountId ?? "none",
  })

  const hasLinkedAccount = !!item.accountId
  const needsAccountSelection = !hasLinkedAccount && accounts.length > 0

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Complete item</h1>
          <p className="text-sm text-muted-foreground">
            Confirm the actual amount and complete this planned item.
          </p>
        </div>
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
          <CardTitle>Item details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Concept</p>
              <p className="font-medium">{item.concept}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Planned amount</p>
              <p className="font-medium">{item.plannedAmount}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Current account</p>
              <p className="font-medium">{describeReference(item.account)}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Status</p>
              <p className="font-medium">{item.status}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Completion details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <FieldShell label="Actual amount">
            <TextField
              min="0"
              onChange={(value) =>
                setForm((current) => ({ ...current, actualAmount: value }))
              }
              required
              step="0.01"
              type="number"
              value={form.actualAmount}
            />
          </FieldShell>

          <FieldShell label="Notes">
            <TextField
              onChange={(value) =>
                setForm((current) => ({ ...current, notes: value }))
              }
              value={form.notes}
            />
          </FieldShell>

          {accounts.length > 0 ? (
            <FieldShell
              label={
                hasLinkedAccount
                  ? "Account (linked)"
                  : "Account (required for completion)"
              }
            >
              <Select
                onValueChange={(value) =>
                  setForm((current) => ({ ...current, accountId: value }))
                }
                value={form.accountId}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      needsAccountSelection ? "Select account" : "No account"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {!needsAccountSelection ? (
                    <SelectItem value="none">No account</SelectItem>
                  ) : null}
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {hasLinkedAccount ? (
                <p className="text-xs text-muted-foreground">
                  This item already has an account linked. You can change it if
                  needed.
                </p>
              ) : null}
            </FieldShell>
          ) : null}

          <FormError error={completeMutation.error} />

          <Button
            className="w-fit"
            disabled={
              completeMutation.isPending ||
              toOptionalPositiveNumber(form.actualAmount) === undefined ||
              (needsAccountSelection && form.accountId === "none")
            }
            onClick={() =>
              void (async () => {
                const actualAmount = toOptionalPositiveNumber(form.actualAmount)
                if (actualAmount === undefined) return
                try {
                  await completeMutation.mutateAsync({
                    itemId,
                    periodId,
                    planId,
                    data: {
                      actualAmount,
                      notes: toOptionalString(form.notes),
                      ...(form.accountId !== "none"
                        ? { accountId: form.accountId }
                        : {}),
                    },
                  })
                  toast.success("Planned item completed.")
                  await navigate({
                    params: { periodId, planId },
                    to: "/plans/$planId/payment-periods/$periodId",
                  })
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Failed to complete planned item."
                  )
                }
              })()
            }
            type="button"
          >
            <Sparkles />
            Complete item
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
