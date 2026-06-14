import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Save, Sparkles, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { CreatePaymentPeriodItemDtoStatus } from "@/api/generated/model"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
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
  StatusBadge,
  TextAreaField,
  TextField,
} from "@/features/plans/plan-ui"
import {
  describeReference,
  getReferenceId,
  readText,
  toOptionalPositiveNumber,
  toOptionalString,
} from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute(
  "/plans/$planId/payment-periods/$periodId/items/$itemId"
)({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        planQueries.paymentPeriodItem(params.itemId)
      ),
      context.queryClient.ensureQueryData(planQueries.accounts(params.planId)),
      context.queryClient.ensureQueryData(
        planQueries.categories(params.planId)
      ),
    ]),
  pendingComponent: ResourcePageSkeleton,
  component: PaymentPeriodItemPage,
})

const itemStatuses = Object.values(CreatePaymentPeriodItemDtoStatus)

function PaymentPeriodItemPage() {
  const navigate = useNavigate()
  const { itemId, periodId, planId } = Route.useParams()
  const { data: item } = useSuspenseQuery(planQueries.paymentPeriodItem(itemId))
  const { data: accounts } = useSuspenseQuery(planQueries.accounts(planId))
  const { data: categories } = useSuspenseQuery(planQueries.categories(planId))
  const updateMutation = useMutation(planMutations.updatePaymentPeriodItem())
  const deleteMutation = useMutation(planMutations.deletePaymentPeriodItem())
  const completeMutation = useMutation(
    planMutations.completePaymentPeriodItem()
  )
  const [form, setForm] = useState({
    account: getReferenceId(item.account) || "none",
    actualAmount: readText(item.actualAmount),
    category: getReferenceId(item.category) || "none",
    concept: readText(item.concept),
    date: readText(item.date),
    externalId: readText(item.externalId),
    fundingAccount: getReferenceId(item.fundingAccount) || "none",
    notes: readText(item.notes),
    plannedAmount: item.plannedAmount.toString(),
    status: item.status,
  })
  const [completion, setCompletion] = useState({
    actualAmount: readText(item.actualAmount) || item.plannedAmount.toString(),
    notes: readText(item.notes),
  })

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Edit planned item</h1>
          <p className="text-sm text-muted-foreground">
            Update, complete, or delete this item.
          </p>
        </div>
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
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle>{item.concept}</CardTitle>
            </div>
            <StatusBadge value={item.status} />
          </div>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FieldShell label="External ID">
            <TextField
              onChange={(value) =>
                setForm((current) => ({ ...current, externalId: value }))
              }
              value={form.externalId}
            />
          </FieldShell>
          <FieldShell label="Date">
            <DatePicker
              onChange={(value) =>
                setForm((current) => ({ ...current, date: value }))
              }
              required
              value={form.date}
            />
          </FieldShell>
          <FieldShell label="Concept">
            <TextField
              onChange={(value) =>
                setForm((current) => ({ ...current, concept: value }))
              }
              value={form.concept}
            />
          </FieldShell>
          <FieldShell label="Planned amount">
            <TextField
              min="0"
              onChange={(value) =>
                setForm((current) => ({ ...current, plannedAmount: value }))
              }
              step="0.01"
              type="number"
              value={form.plannedAmount}
            />
          </FieldShell>
          <FieldShell label="Actual amount">
            <TextField
              min="0"
              onChange={(value) =>
                setForm((current) => ({ ...current, actualAmount: value }))
              }
              step="0.01"
              type="number"
              value={form.actualAmount}
            />
          </FieldShell>
          <FieldShell label="Status">
            <Select
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  status: value as typeof form.status,
                }))
              }
              value={form.status}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {itemStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>
          <FieldShell label="Category">
            <Select
              onValueChange={(value) =>
                setForm((current) => ({ ...current, category: value }))
              }
              value={form.category}
            >
              <SelectTrigger>
                <SelectValue placeholder="Optional category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Current: {describeReference(item.category)}
            </p>
          </FieldShell>
          <FieldShell label="Account">
            <Select
              onValueChange={(value) =>
                setForm((current) => ({ ...current, account: value }))
              }
              value={form.account}
            >
              <SelectTrigger>
                <SelectValue placeholder="Optional account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No account</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Current: {describeReference(item.account)}
            </p>
          </FieldShell>
          <FieldShell label="Funding account">
            <Select
              onValueChange={(value) =>
                setForm((current) => ({ ...current, fundingAccount: value }))
              }
              value={form.fundingAccount}
            >
              <SelectTrigger>
                <SelectValue placeholder="Optional funding account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No funding account</SelectItem>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Current: {describeReference(item.fundingAccount)}
            </p>
          </FieldShell>
          <FieldShell className="md:col-span-2 lg:col-span-3" label="Notes">
            <TextAreaField
              onChange={(value) =>
                setForm((current) => ({ ...current, notes: value }))
              }
              value={form.notes}
            />
          </FieldShell>
          <FormError
            error={
              updateMutation.error ??
              deleteMutation.error ??
              completeMutation.error
            }
          />
          <div className="rounded-xl border p-4 md:col-span-2 lg:col-span-3">
            <h3 className="font-medium">Complete item</h3>
            <div className="mt-4 grid gap-4 md:grid-cols-[160px_1fr_auto] md:items-end">
              <FieldShell label="Actual amount">
                <TextField
                  min="0"
                  onChange={(value) =>
                    setCompletion((current) => ({
                      ...current,
                      actualAmount: value,
                    }))
                  }
                  step="0.01"
                  type="number"
                  value={completion.actualAmount}
                />
              </FieldShell>
              <FieldShell label="Completion notes">
                <TextField
                  onChange={(value) =>
                    setCompletion((current) => ({ ...current, notes: value }))
                  }
                  value={completion.notes}
                />
              </FieldShell>
              <Button
                disabled={
                  completeMutation.isPending ||
                  toOptionalPositiveNumber(completion.actualAmount) ===
                    undefined
                }
                onClick={() =>
                  void (async () => {
                    const actualAmount = toOptionalPositiveNumber(
                      completion.actualAmount
                    )
                    if (actualAmount === undefined) return
                    try {
                      await completeMutation.mutateAsync({
                        itemId,
                        periodId,
                        planId,
                        data: {
                          actualAmount,
                          notes: toOptionalString(completion.notes),
                        },
                      })
                      toast.success("Planned item completed.")
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
                variant="outline"
              >
                <Sparkles />
                Complete item
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 md:col-span-2 lg:col-span-3">
            <Button
              disabled={
                updateMutation.isPending ||
                !form.date ||
                !form.concept.trim() ||
                !form.plannedAmount.trim() ||
                toOptionalPositiveNumber(form.plannedAmount) === undefined
              }
              onClick={() =>
                void (async () => {
                  try {
                    await updateMutation.mutateAsync({
                      data: {
                        account:
                          form.account === "none" ? undefined : form.account,
                        actualAmount: toOptionalPositiveNumber(
                          form.actualAmount
                        ),
                        category:
                          form.category === "none" ? undefined : form.category,
                        concept: toOptionalString(form.concept),
                        date: toOptionalString(form.date),
                        externalId: toOptionalString(form.externalId),
                        fundingAccount:
                          form.fundingAccount === "none"
                            ? undefined
                            : form.fundingAccount,
                        notes: toOptionalString(form.notes),
                        plannedAmount: toOptionalPositiveNumber(
                          form.plannedAmount
                        ),
                        status: form.status,
                      },
                      itemId,
                      periodId,
                      planId,
                    })
                    toast.success("Planned item updated.")
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Failed to update planned item."
                    )
                  }
                })()
              }
              type="button"
            >
              <Save />
              Save item
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={deleteMutation.isPending}
                  type="button"
                  variant="destructive"
                >
                  <Trash2 />
                  Delete item
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    Delete payment period item?
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deleteMutation.isPending}
                    onClick={() =>
                      void (async () => {
                        try {
                          await deleteMutation.mutateAsync({
                            itemId,
                            periodId,
                            planId,
                          })
                          toast.success("Planned item deleted.")
                          await navigate({
                            params: { periodId, planId },
                            to: "/plans/$planId/payment-periods/$periodId",
                          })
                        } catch (error) {
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : "Failed to delete planned item."
                          )
                        }
                      })()
                    }
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
