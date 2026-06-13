import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"

import {
  CreateRecurringExpenseDtoDayRule,
  CreateRecurringExpenseDtoFrequency,
  type RecurringExpenseResponseDto,
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
  TextField,
} from "@/features/plans/plan-ui"
import {
  describeReference,
  formatCurrency,
  getReferenceId,
  isPositiveIntegerListValid,
  parsePositiveIntegerList,
  readText,
  toOptionalPositiveInteger,
  toOptionalPositiveNumber,
  toOptionalString,
} from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute("/plans/$planId/recurring-expenses")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(planQueries.detail(params.planId)),
  pendingComponent: ResourcePageSkeleton,
  component: RecurringExpensesPage,
})

const frequencies = Object.values(CreateRecurringExpenseDtoFrequency)
const dayRules = Object.values(CreateRecurringExpenseDtoDayRule)
type RecurringFrequency =
  (typeof CreateRecurringExpenseDtoFrequency)[keyof typeof CreateRecurringExpenseDtoFrequency]
type RecurringDayRule =
  (typeof CreateRecurringExpenseDtoDayRule)[keyof typeof CreateRecurringExpenseDtoDayRule]

function RecurringExpensesPage() {
  const { planId } = Route.useParams()
  const { data: plan } = useSuspenseQuery(planQueries.detail(planId))
  const createExpenseMutation = useMutation(
    planMutations.createRecurringExpense()
  )
  const updateExpenseMutation = useMutation(
    planMutations.updateRecurringExpense()
  )
  const deleteExpenseMutation = useMutation(
    planMutations.deleteRecurringExpense()
  )
  const [createForm, setCreateForm] = useState<{
    account: string
    amount: string
    category: string
    concept: string
    date: string
    day: string
    dayRule: string
    days: string
    frequency: RecurringFrequency
    fundingAccount: string
  }>({
    account: "none",
    amount: "",
    category: "none",
    concept: "",
    date: "",
    day: "",
    dayRule: "none",
    days: "",
    frequency: CreateRecurringExpenseDtoFrequency.monthly,
    fundingAccount: "none",
  })

  async function handleCreate() {
    const amount = toOptionalPositiveNumber(createForm.amount)
    const day = toOptionalPositiveInteger(createForm.day)

    if (amount === undefined || (createForm.day.trim() && day === undefined)) {
      return
    }

    if (
      createForm.days.trim() &&
      !isPositiveIntegerListValid(createForm.days)
    ) {
      return
    }

    await createExpenseMutation.mutateAsync({
      data: {
        account: createForm.account === "none" ? undefined : createForm.account,
        amount,
        category:
          createForm.category === "none" ? undefined : createForm.category,
        concept: createForm.concept,
        date: toOptionalString(createForm.date),
        day,
        dayRule:
          createForm.dayRule === "none"
            ? undefined
            : (createForm.dayRule as (typeof dayRules)[number]),
        days: createForm.days.trim()
          ? parsePositiveIntegerList(createForm.days)
          : undefined,
        frequency: createForm.frequency,
        fundingAccount:
          createForm.fundingAccount === "none"
            ? undefined
            : createForm.fundingAccount,
      },
      planId,
    })

    setCreateForm({
      account: "none",
      amount: "",
      category: "none",
      concept: "",
      date: "",
      day: "",
      dayRule: "none",
      days: "",
      frequency: CreateRecurringExpenseDtoFrequency.monthly,
      fundingAccount: "none",
    })
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Recurring expenses</h1>
          <p className="text-sm text-muted-foreground">
            Model periodic obligations that can later become planned payment
            items.
          </p>
        </div>
        <Link
          className="text-sm text-muted-foreground hover:text-foreground"
          params={{ planId }}
          to="/plans/$planId"
        >
          Back to plan
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Create recurring expense</CardTitle>
          <CardDescription>
            Frequency determines which day fields are meaningful.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
          <FieldShell label="Amount">
            <TextField
              min="0"
              onChange={(value) =>
                setCreateForm((current) => ({
                  ...current,
                  amount: value,
                }))
              }
              step="0.01"
              type="number"
              value={createForm.amount}
            />
          </FieldShell>
          <FieldShell label="Frequency">
            <Select
              onValueChange={(value) =>
                setCreateForm((current) => ({
                  ...current,
                  frequency: value as RecurringFrequency,
                }))
              }
              value={createForm.frequency}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                {frequencies.map((frequency) => (
                  <SelectItem key={frequency} value={frequency}>
                    {frequency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>
          <FieldShell label="Day">
            <TextField
              min="1"
              onChange={(value) =>
                setCreateForm((current) => ({
                  ...current,
                  day: value,
                }))
              }
              type="number"
              value={createForm.day}
            />
          </FieldShell>
          <FieldShell label="Days (comma separated)">
            <TextField
              onChange={(value) =>
                setCreateForm((current) => ({
                  ...current,
                  days: value,
                }))
              }
              placeholder="1, 15"
              value={createForm.days}
            />
          </FieldShell>
          <FieldShell label="Fixed date">
            <DatePicker
              onChange={(value) =>
                setCreateForm((current) => ({
                  ...current,
                  date: value,
                }))
              }
              value={createForm.date}
            />
          </FieldShell>
          <FieldShell label="Day rule">
            <Select
              onValueChange={(value) =>
                setCreateForm((current) => ({
                  ...current,
                  dayRule: value as RecurringDayRule,
                }))
              }
              value={createForm.dayRule}
            >
              <SelectTrigger>
                <SelectValue placeholder="Optional day rule" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No day rule</SelectItem>
                {dayRules.map((dayRule) => (
                  <SelectItem key={dayRule} value={dayRule}>
                    {dayRule}
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
          <div className="flex flex-col gap-3 md:col-span-2 lg:col-span-3">
            <FormError error={createExpenseMutation.error} />
            <Button
              className="w-fit"
              disabled={
                createExpenseMutation.isPending ||
                !createForm.concept.trim() ||
                !createForm.amount.trim() ||
                toOptionalPositiveNumber(createForm.amount) === undefined ||
                (Boolean(createForm.day.trim()) &&
                  toOptionalPositiveInteger(createForm.day) === undefined) ||
                (Boolean(createForm.days.trim()) &&
                  !isPositiveIntegerListValid(createForm.days))
              }
              onClick={() => void handleCreate()}
              type="button"
            >
              {createExpenseMutation.isPending
                ? "Creating..."
                : "Create recurring expense"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {plan.recurringExpenses.length === 0 ? (
        <EmptyState
          description="No recurring expenses have been added yet."
          title="No recurring expenses yet"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plan.recurringExpenses.map((expense) => (
            <RecurringExpenseCard
              categories={plan.allocationCategories}
              deleteError={deleteExpenseMutation.error}
              deletePendingId={
                deleteExpenseMutation.variables?.recurringExpenseId ?? null
              }
              expense={expense}
              key={expense.id}
              onDelete={() =>
                void deleteExpenseMutation.mutateAsync({
                  planId,
                  recurringExpenseId: expense.id,
                })
              }
              onSave={(data) =>
                void updateExpenseMutation.mutateAsync({
                  data,
                  planId,
                  recurringExpenseId: expense.id,
                })
              }
              saveError={updateExpenseMutation.error}
              savePendingId={
                updateExpenseMutation.variables?.recurringExpenseId ?? null
              }
              selectableAccounts={plan.accounts}
            />
          ))}
        </div>
      )}
    </main>
  )
}

function RecurringExpenseCard({
  categories,
  deleteError,
  deletePendingId,
  expense,
  onDelete,
  onSave,
  saveError,
  savePendingId,
  selectableAccounts,
}: {
  categories: Array<{ id: string; name: string }>
  deleteError: Error | null
  deletePendingId: string | null
  expense: RecurringExpenseResponseDto
  onDelete: () => void
  onSave: (data: {
    account?: string
    amount?: number
    category?: string
    concept?: string
    date?: string
    day?: number
    dayRule?: RecurringDayRule
    days?: number[]
    frequency?: RecurringFrequency
    fundingAccount?: string
  }) => void
  saveError: Error | null
  savePendingId: string | null
  selectableAccounts: Array<{ id: string; name: string }>
}) {
  const [form, setForm] = useState<{
    account: string
    amount: string
    category: string
    concept: string
    date: string
    day: string
    dayRule: string
    days: string
    frequency: RecurringFrequency
    fundingAccount: string
  }>({
    account: getReferenceId(expense.account) || "none",
    amount: expense.amount.toString(),
    category: getReferenceId(expense.category) || "none",
    concept: readText(expense.concept),
    date: readText(expense.date),
    day: readText(expense.day),
    dayRule: readText(expense.dayRule) || "none",
    days: expense.days.map((day) => readText(day.day)).join(", "),
    frequency: expense.frequency as RecurringFrequency,
    fundingAccount: getReferenceId(expense.fundingAccount) || "none",
  })
  const isSaving = savePendingId === expense.id
  const isDeleting = deletePendingId === expense.id

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{expense.concept}</CardTitle>
            <CardDescription>
              {formatCurrency(expense.amount, "MXN")}
            </CardDescription>
          </div>
          <StatusBadge value={expense.frequency} />
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
        <FieldShell label="Amount">
          <TextField
            min="0"
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                amount: value,
              }))
            }
            step="0.01"
            type="number"
            value={form.amount}
          />
        </FieldShell>
        <FieldShell label="Frequency">
          <Select
            onValueChange={(value) =>
              setForm((current) => ({
                ...current,
                frequency: value as RecurringFrequency,
              }))
            }
            value={form.frequency}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select frequency" />
            </SelectTrigger>
            <SelectContent>
              {frequencies.map((frequency) => (
                <SelectItem key={frequency} value={frequency}>
                  {frequency}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldShell>
        <FieldShell label="Day">
          <TextField
            min="1"
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                day: value,
              }))
            }
            type="number"
            value={form.day}
          />
        </FieldShell>
        <FieldShell label="Days (comma separated)">
          <TextField
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                days: value,
              }))
            }
            value={form.days}
          />
        </FieldShell>
        <FieldShell label="Fixed date">
          <DatePicker
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                date: value,
              }))
            }
            value={form.date}
          />
        </FieldShell>
        <FieldShell label="Day rule">
          <Select
            onValueChange={(value) =>
              setForm((current) => ({
                ...current,
                dayRule: value as RecurringDayRule,
              }))
            }
            value={form.dayRule}
          >
            <SelectTrigger>
              <SelectValue placeholder="Optional day rule" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No day rule</SelectItem>
              {dayRules.map((dayRule) => (
                <SelectItem key={dayRule} value={dayRule}>
                  {dayRule}
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
            Current: {describeReference(expense.category)}
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
            Current: {describeReference(expense.account)}
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
            Current: {describeReference(expense.fundingAccount)}
          </p>
        </FieldShell>
        <div className="rounded-xl border p-4 text-sm text-muted-foreground md:col-span-2 lg:col-span-3">
          Last payment: {readText(expense.lastPaymentDate) || "Never"}
          {expense.lastPaymentAmount != null
            ? ` · ${expense.lastPaymentAmount}`
            : ""}
        </div>
        <div className="flex flex-col gap-3 md:col-span-2 lg:col-span-3">
          <FormError error={saveError ?? deleteError} />
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={
                isSaving ||
                !form.concept.trim() ||
                !form.amount.trim() ||
                toOptionalPositiveNumber(form.amount) === undefined ||
                (Boolean(form.day.trim()) &&
                  toOptionalPositiveInteger(form.day) === undefined) ||
                (Boolean(form.days.trim()) &&
                  !isPositiveIntegerListValid(form.days))
              }
              onClick={() =>
                onSave({
                  account: form.account === "none" ? undefined : form.account,
                  amount: toOptionalPositiveNumber(form.amount),
                  category:
                    form.category === "none" ? undefined : form.category,
                  concept: toOptionalString(form.concept),
                  date: toOptionalString(form.date),
                  day: toOptionalPositiveInteger(form.day),
                  dayRule:
                    form.dayRule === "none"
                      ? undefined
                      : (form.dayRule as RecurringDayRule),
                  days:
                    form.days.trim() && isPositiveIntegerListValid(form.days)
                      ? parsePositiveIntegerList(form.days)
                      : undefined,
                  frequency: form.frequency,
                  fundingAccount:
                    form.fundingAccount === "none"
                      ? undefined
                      : form.fundingAccount,
                })
              }
              type="button"
            >
              {isSaving ? "Saving..." : "Save"}
            </Button>
            <Button
              disabled={isDeleting}
              onClick={onDelete}
              type="button"
              variant="destructive"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
