import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"

import {
  CreatePaymentPeriodItemDtoStatus,
  type PaymentPeriodItemResponseDto,
} from "@/api/generated/model"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
  EmptyState,
  FieldShell,
  FormError,
  ResourcePageSkeleton,
  StatusBadge,
  TextAreaField,
  TextField,
} from "@/features/plans/plan-ui"
import {
  describeReference,
  formatCurrency,
  getReferenceId,
  readText,
  toOptionalPositiveNumber,
  toOptionalString,
} from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute(
  "/plans/$planId/payment-periods/$periodId"
)({
  loader: async ({ context, params }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(
        planQueries.paymentPeriod(params.periodId)
      ),
      context.queryClient.ensureQueryData(planQueries.detail(params.planId)),
    ])
  },
  pendingComponent: ResourcePageSkeleton,
  component: PaymentPeriodDetailPage,
})

const itemStatuses = Object.values(CreatePaymentPeriodItemDtoStatus)
type ItemStatus =
  (typeof CreatePaymentPeriodItemDtoStatus)[keyof typeof CreatePaymentPeriodItemDtoStatus]

function PaymentPeriodDetailPage() {
  const { periodId, planId } = Route.useParams()
  const { data: period } = useSuspenseQuery(planQueries.paymentPeriod(periodId))
  const { data: plan } = useSuspenseQuery(planQueries.detail(planId))
  const createItemMutation = useMutation(
    planMutations.createPaymentPeriodItem()
  )
  const updateItemMutation = useMutation(
    planMutations.updatePaymentPeriodItem()
  )
  const deleteItemMutation = useMutation(
    planMutations.deletePaymentPeriodItem()
  )
  const completeItemMutation = useMutation(
    planMutations.completePaymentPeriodItem()
  )
  const [createForm, setCreateForm] = useState<{
    account: string
    actualAmount: string
    category: string
    concept: string
    date: string
    externalId: string
    fundingAccount: string
    notes: string
    plannedAmount: string
    status: ItemStatus
  }>({
    account: "none",
    actualAmount: "",
    category: "none",
    concept: "",
    date: "",
    externalId: "",
    fundingAccount: "none",
    notes: "",
    plannedAmount: "",
    status: CreatePaymentPeriodItemDtoStatus.pending,
  })

  async function handleCreate() {
    const plannedAmount = toOptionalPositiveNumber(createForm.plannedAmount)

    if (plannedAmount === undefined) {
      return
    }

    if (
      createForm.actualAmount.trim() &&
      toOptionalPositiveNumber(createForm.actualAmount) === undefined
    ) {
      return
    }

    await createItemMutation.mutateAsync({
      data: {
        account: createForm.account === "none" ? undefined : createForm.account,
        actualAmount: toOptionalPositiveNumber(createForm.actualAmount),
        category:
          createForm.category === "none" ? undefined : createForm.category,
        concept: createForm.concept,
        date: createForm.date,
        externalId: toOptionalString(createForm.externalId),
        fundingAccount:
          createForm.fundingAccount === "none"
            ? undefined
            : createForm.fundingAccount,
        notes: toOptionalString(createForm.notes),
        plannedAmount,
        status: createForm.status,
      },
      periodId,
      planId,
    })

    setCreateForm({
      account: "none",
      actualAmount: "",
      category: "none",
      concept: "",
      date: readText(period.incomeDate),
      externalId: "",
      fundingAccount: "none",
      notes: "",
      plannedAmount: "",
      status: CreatePaymentPeriodItemDtoStatus.pending,
    })
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">
            Payment period {period.incomeDate}
          </h1>
          <p className="text-sm text-muted-foreground">
            Add and track the planned items that belong to this period.
          </p>
        </div>
        <Link
          className="text-sm text-muted-foreground hover:text-foreground"
          params={{ planId }}
          to="/plans/$planId/payment-periods"
        >
          Back to payment periods
        </Link>
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

      <Card>
        <CardHeader>
          <CardTitle>Create planned item</CardTitle>
          <CardDescription>
            Keep category and account references aligned with the plan
            configuration.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FieldShell label="External ID">
            <TextField
              onChange={(value) =>
                setCreateForm((current) => ({
                  ...current,
                  externalId: value,
                }))
              }
              value={createForm.externalId}
            />
          </FieldShell>
          <FieldShell label="Date">
            <DatePicker
              onChange={(value) =>
                setCreateForm((current) => ({
                  ...current,
                  date: value,
                }))
              }
              required
              value={createForm.date}
            />
          </FieldShell>
          <FieldShell label="Concept">
            <TextField
              onChange={(value) =>
                setCreateForm((current) => ({
                  ...current,
                  concept: value,
                }))
              }
              value={createForm.concept}
            />
          </FieldShell>
          <FieldShell label="Planned amount">
            <TextField
              min="0"
              onChange={(value) =>
                setCreateForm((current) => ({
                  ...current,
                  plannedAmount: value,
                }))
              }
              step="0.01"
              type="number"
              value={createForm.plannedAmount}
            />
          </FieldShell>
          <FieldShell label="Actual amount">
            <TextField
              min="0"
              onChange={(value) =>
                setCreateForm((current) => ({
                  ...current,
                  actualAmount: value,
                }))
              }
              step="0.01"
              type="number"
              value={createForm.actualAmount}
            />
          </FieldShell>
          <FieldShell label="Status">
            <Select
              onValueChange={(value) =>
                setCreateForm((current) => ({
                  ...current,
                  status: value as ItemStatus,
                }))
              }
              value={createForm.status}
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
                setCreateForm((current) => ({ ...current, category: value }))
              }
              value={createForm.category}
            >
              <SelectTrigger>
                <SelectValue placeholder="Optional category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No category</SelectItem>
                {plan.allocationCategories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>
          <FieldShell label="Account">
            <Select
              onValueChange={(value) =>
                setCreateForm((current) => ({ ...current, account: value }))
              }
              value={createForm.account}
            >
              <SelectTrigger>
                <SelectValue placeholder="Optional account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No account</SelectItem>
                {plan.accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>
          <FieldShell label="Funding account">
            <Select
              onValueChange={(value) =>
                setCreateForm((current) => ({
                  ...current,
                  fundingAccount: value,
                }))
              }
              value={createForm.fundingAccount}
            >
              <SelectTrigger>
                <SelectValue placeholder="Optional funding account" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No funding account</SelectItem>
                {plan.accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>
          <FieldShell className="md:col-span-2 lg:col-span-3" label="Notes">
            <TextAreaField
              onChange={(value) =>
                setCreateForm((current) => ({
                  ...current,
                  notes: value,
                }))
              }
              value={createForm.notes}
            />
          </FieldShell>
          <div className="flex flex-col gap-3 md:col-span-2 lg:col-span-3">
            <FormError error={createItemMutation.error} />
            <Button
              className="w-fit"
              disabled={
                createItemMutation.isPending ||
                !createForm.date ||
                !createForm.concept.trim() ||
                !createForm.plannedAmount.trim() ||
                toOptionalPositiveNumber(createForm.plannedAmount) ===
                  undefined ||
                (Boolean(createForm.actualAmount.trim()) &&
                  toOptionalPositiveNumber(createForm.actualAmount) ===
                    undefined)
              }
              onClick={() => void handleCreate()}
              type="button"
            >
              {createItemMutation.isPending ? "Creating..." : "Create item"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {period.items.length === 0 ? (
        <EmptyState
          description="No planned items have been added to this period yet."
          title="No planned items yet"
        />
      ) : (
        <div className="grid gap-4">
          {period.items.map((item) => (
            <PaymentPeriodItemCard
              categories={plan.allocationCategories}
              deleteError={deleteItemMutation.error}
              deletePendingId={deleteItemMutation.variables?.itemId ?? null}
              item={item}
              key={item.id}
              onComplete={(data) =>
                void completeItemMutation.mutateAsync({
                  data,
                  itemId: item.id,
                  periodId,
                  planId,
                })
              }
              onDelete={() =>
                void deleteItemMutation.mutateAsync({
                  itemId: item.id,
                  periodId,
                  planId,
                })
              }
              onSave={(data) =>
                void updateItemMutation.mutateAsync({
                  data,
                  itemId: item.id,
                  periodId,
                  planId,
                })
              }
              saveError={updateItemMutation.error ?? completeItemMutation.error}
              savePendingId={
                updateItemMutation.variables?.itemId ??
                completeItemMutation.variables?.itemId ??
                null
              }
              selectableAccounts={plan.accounts}
            />
          ))}
        </div>
      )}
    </main>
  )
}

function PaymentPeriodItemCard({
  categories,
  deleteError,
  deletePendingId,
  item,
  onComplete,
  onDelete,
  onSave,
  saveError,
  savePendingId,
  selectableAccounts,
}: {
  categories: Array<{ id: string; name: string }>
  deleteError: Error | null
  deletePendingId: string | null
  item: PaymentPeriodItemResponseDto
  onComplete: (data: { actualAmount: number; notes?: string }) => void
  onDelete: () => void
  onSave: (data: {
    account?: string
    actualAmount?: number
    category?: string
    concept?: string
    date?: string
    externalId?: string
    fundingAccount?: string
    notes?: string
    plannedAmount?: number
    status?: ItemStatus
  }) => void
  saveError: Error | null
  savePendingId: string | null
  selectableAccounts: Array<{ id: string; name: string }>
}) {
  const [form, setForm] = useState<{
    account: string
    actualAmount: string
    category: string
    concept: string
    date: string
    externalId: string
    fundingAccount: string
    notes: string
    plannedAmount: string
    status: ItemStatus
  }>({
    account: getReferenceId(item.account) || "none",
    actualAmount: readText(item.actualAmount),
    category: getReferenceId(item.category) || "none",
    concept: readText(item.concept),
    date: readText(item.date),
    externalId: readText(item.externalId),
    fundingAccount: getReferenceId(item.fundingAccount) || "none",
    notes: readText(item.notes),
    plannedAmount: item.plannedAmount.toString(),
    status: item.status as ItemStatus,
  })
  const [completion, setCompletion] = useState<{
    actualAmount: string
    notes: string
  }>({
    actualAmount: readText(item.actualAmount) || item.plannedAmount.toString(),
    notes: readText(item.notes),
  })
  const isSaving = savePendingId === item.id
  const isDeleting = deletePendingId === item.id

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div>
            <CardTitle>{item.concept}</CardTitle>
            <CardDescription>
              {item.date} · planned {item.plannedAmount.toLocaleString()}
            </CardDescription>
          </div>
          <StatusBadge value={item.status} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <FieldShell label="External ID">
          <TextField
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                externalId: value,
              }))
            }
            value={form.externalId}
          />
        </FieldShell>
        <FieldShell label="Date">
          <DatePicker
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                date: value,
              }))
            }
            required
            value={form.date}
          />
        </FieldShell>
        <FieldShell label="Concept">
          <TextField
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                concept: value,
              }))
            }
            value={form.concept}
          />
        </FieldShell>
        <FieldShell label="Planned amount">
          <TextField
            min="0"
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                plannedAmount: value,
              }))
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
              setForm((current) => ({
                ...current,
                actualAmount: value,
              }))
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
                status: value as ItemStatus,
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
              {selectableAccounts.map((account) => (
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
              {selectableAccounts.map((account) => (
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
              setForm((current) => ({
                ...current,
                notes: value,
              }))
            }
            value={form.notes}
          />
        </FieldShell>
        <div className="rounded-xl border p-4 md:col-span-2 lg:col-span-3">
          <h3 className="font-medium">Complete item</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Use this action when the planned item has actually been paid or
            received.
          </p>
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
                  setCompletion((current) => ({
                    ...current,
                    notes: value,
                  }))
                }
                value={completion.notes}
              />
            </FieldShell>
            <Button
              disabled={
                isSaving ||
                toOptionalPositiveNumber(completion.actualAmount) === undefined
              }
              onClick={() => {
                const actualAmount = toOptionalPositiveNumber(
                  completion.actualAmount
                )

                if (actualAmount === undefined) {
                  return
                }

                onComplete({
                  actualAmount,
                  notes: toOptionalString(completion.notes),
                })
              }}
              type="button"
              variant="outline"
            >
              Complete item
            </Button>
          </div>
        </div>
        <div className="flex flex-col gap-3 md:col-span-2 lg:col-span-3">
          <FormError error={saveError ?? deleteError} />
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={
                isSaving ||
                !form.date ||
                !form.concept.trim() ||
                !form.plannedAmount.trim() ||
                toOptionalPositiveNumber(form.plannedAmount) === undefined ||
                (Boolean(form.actualAmount.trim()) &&
                  toOptionalPositiveNumber(form.actualAmount) === undefined)
              }
              onClick={() =>
                onSave({
                  account: form.account === "none" ? undefined : form.account,
                  actualAmount: toOptionalPositiveNumber(form.actualAmount),
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
                  plannedAmount: toOptionalPositiveNumber(form.plannedAmount),
                  status: form.status,
                })
              }
              type="button"
            >
              {isSaving ? "Saving..." : "Save item"}
            </Button>
            <Button
              disabled={isDeleting}
              onClick={onDelete}
              type="button"
              variant="destructive"
            >
              {isDeleting ? "Deleting..." : "Delete item"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
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
