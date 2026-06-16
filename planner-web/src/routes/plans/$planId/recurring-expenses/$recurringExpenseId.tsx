import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Save, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import {
  CreateRecurringExpenseDtoCustomIntervalUnit,
  CreateRecurringExpenseDtoDayRule,
  CreateRecurringExpenseDtoFrequency,
} from "@/api/generated/model"
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
  TextField,
} from "@/features/plans/plan-ui"
import {
  describeReference,
  getReferenceId,
  readText,
  toOptionalPositiveInteger,
  toOptionalPositiveNumber,
  toOptionalString,
} from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute(
  "/plans/$planId/recurring-expenses/$recurringExpenseId"
)({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        planQueries.recurringExpense(params.planId, params.recurringExpenseId)
      ),
      context.queryClient.ensureQueryData(planQueries.accounts(params.planId)),
      context.queryClient.ensureQueryData(
        planQueries.categories(params.planId)
      ),
    ]),
  pendingComponent: ResourcePageSkeleton,
  component: EditRecurringExpensePage,
})

const frequencies = Object.values(CreateRecurringExpenseDtoFrequency)
const dayRules = Object.values(CreateRecurringExpenseDtoDayRule)
type DayRuleValue = (typeof dayRules)[number] | "none"

function EditRecurringExpensePage() {
  const navigate = useNavigate()
  const { planId, recurringExpenseId } = Route.useParams()
  const { data: expense } = useSuspenseQuery(
    planQueries.recurringExpense(planId, recurringExpenseId)
  )
  const { data: accounts } = useSuspenseQuery(planQueries.accounts(planId))
  const { data: categories } = useSuspenseQuery(planQueries.categories(planId))
  const updateMutation = useMutation(planMutations.updateRecurringExpense())
  const deleteMutation = useMutation(planMutations.deleteRecurringExpense())
  const [form, setForm] = useState({
    account: getReferenceId(expense.account) || "none",
    amount: expense.amount.toString(),
    category: getReferenceId(expense.category) || "none",
    concept: expense.concept,
    customIntervalUnit: expense.customIntervalUnit || "",
    date: readText(expense.date),
    day: readText(expense.day),
    dayRule: (readText(expense.dayRule) || "none") as DayRuleValue,
    days: expense.days.map((d) => d.day),
    frequency: expense.frequency,
    fundingAccount: getReferenceId(expense.fundingAccount) || "none",
  })

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Edit recurring expense</h1>
          <p className="text-sm text-muted-foreground">
            Update or delete this recurring expense.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link params={{ planId }} to="/plans/$planId/recurring-expenses">
            <ArrowLeft />
            Back to expenses
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{expense.concept}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <FieldShell label="Concept">
            <TextField
              onChange={(value) =>
                setForm((current) => ({ ...current, concept: value }))
              }
              value={form.concept}
            />
          </FieldShell>
          <FieldShell label="Amount">
            <TextField
              min="0"
              onChange={(value) =>
                setForm((current) => ({ ...current, amount: value }))
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
                  frequency: value as typeof form.frequency,
                  ...(value !== CreateRecurringExpenseDtoFrequency.custom
                    ? { customIntervalUnit: "", days: [] }
                    : {}),
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
                    {frequency === CreateRecurringExpenseDtoFrequency.custom
                      ? "Custom / Multiple days"
                      : frequency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>
          {String(form.frequency) ===
            CreateRecurringExpenseDtoFrequency.custom && (
            <FieldShell label="Repeats every">
              <Select
                onValueChange={(value) =>
                  setForm((current) => ({
                    ...current,
                    customIntervalUnit: value,
                    days: [],
                  }))
                }
                value={form.customIntervalUnit}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select interval" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Week</SelectItem>
                  <SelectItem value="month">Month</SelectItem>
                </SelectContent>
              </Select>
            </FieldShell>
          )}
          {String(form.frequency) ===
            CreateRecurringExpenseDtoFrequency.monthly && (
            <FieldShell label="Day">
              <TextField
                min="1"
                onChange={(value) =>
                  setForm((current) => ({ ...current, day: value }))
                }
                type="number"
                value={form.day}
              />
            </FieldShell>
          )}
          {String(form.frequency) ===
            CreateRecurringExpenseDtoFrequency.custom && (
            <FieldShell label="Days">
              <div className="flex flex-col gap-2">
                <div className="flex flex-wrap gap-1">
                  {form.customIntervalUnit ===
                  CreateRecurringExpenseDtoCustomIntervalUnit.month
                    ? Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                        <Button
                          key={day}
                          onClick={() =>
                            setForm((current) => ({
                              ...current,
                              days: current.days.includes(day)
                                ? current.days.filter((d) => d !== day)
                                : [...current.days, day].sort((a, b) => a - b),
                            }))
                          }
                          size="sm"
                          type="button"
                          variant={
                            form.days.includes(day) ? "default" : "outline"
                          }
                        >
                          {day}
                        </Button>
                      ))
                    : form.customIntervalUnit ===
                        CreateRecurringExpenseDtoCustomIntervalUnit.week
                      ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                          (day, index) => (
                            <Button
                              key={day}
                              onClick={() =>
                                setForm((current) => ({
                                  ...current,
                                  days: current.days.includes(index + 1)
                                    ? current.days.filter(
                                        (d) => d !== index + 1
                                      )
                                    : [...current.days, index + 1].sort(
                                        (a, b) => a - b
                                      ),
                                }))
                              }
                              size="sm"
                              type="button"
                              variant={
                                form.days.includes(index + 1)
                                  ? "default"
                                  : "outline"
                              }
                            >
                              {day}
                            </Button>
                          )
                        )
                      : null}
                </div>
                {form.days.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Selected:&nbsp;
                    {form.customIntervalUnit ===
                    CreateRecurringExpenseDtoCustomIntervalUnit.week
                      ? form.days
                          .map(
                            (d) =>
                              ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][
                                d - 1
                              ]
                          )
                          .join(", ")
                      : form.days.join(", ")}
                  </p>
                )}
              </div>
            </FieldShell>
          )}
          <FieldShell label="Fixed date">
            <DatePicker
              onChange={(value) =>
                setForm((current) => ({ ...current, date: value }))
              }
              value={form.date}
            />
          </FieldShell>
          <FieldShell label="Day rule">
            <Select
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  dayRule: value as DayRuleValue,
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
                {accounts.map((account) => (
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
                {accounts.map((account) => (
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
          <FormError error={updateMutation.error ?? deleteMutation.error} />
          <div className="flex flex-wrap gap-2 md:col-span-2 lg:col-span-3">
            <Button
              disabled={
                updateMutation.isPending ||
                !form.concept.trim() ||
                !form.amount.trim() ||
                toOptionalPositiveNumber(form.amount) === undefined ||
                (Boolean(form.day.trim()) &&
                  toOptionalPositiveInteger(form.day) === undefined) ||
                (String(form.frequency) ===
                  CreateRecurringExpenseDtoFrequency.custom &&
                  !form.customIntervalUnit) ||
                (String(form.frequency) ===
                  CreateRecurringExpenseDtoFrequency.custom &&
                  form.days.length === 0)
              }
              onClick={() =>
                void (async () => {
                  try {
                    await updateMutation.mutateAsync({
                      planId,
                      recurringExpenseId,
                      data: {
                        account:
                          form.account === "none" ? undefined : form.account,
                        amount: toOptionalPositiveNumber(form.amount),
                        category:
                          form.category === "none" ? undefined : form.category,
                        concept: form.concept,
                        customIntervalUnit:
                          String(form.frequency) ===
                          CreateRecurringExpenseDtoFrequency.custom
                            ? (form.customIntervalUnit as CreateRecurringExpenseDtoCustomIntervalUnit)
                            : undefined,
                        date: toOptionalString(form.date),
                        day: toOptionalPositiveInteger(form.day),
                        dayRule:
                          form.dayRule === "none" ? undefined : form.dayRule,
                        days:
                          String(form.frequency) ===
                          CreateRecurringExpenseDtoFrequency.custom
                            ? form.days
                            : undefined,
                        frequency: form.frequency,
                        fundingAccount:
                          form.fundingAccount === "none"
                            ? undefined
                            : form.fundingAccount,
                      },
                    })
                    toast.success("Recurring expense updated.")
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Failed to update recurring expense."
                    )
                  }
                })()
              }
              type="button"
            >
              <Save />
              Save changes
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={deleteMutation.isPending}
                  type="button"
                  variant="destructive"
                >
                  <Trash2 />
                  Delete expense
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete recurring expense?</AlertDialogTitle>
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
                            planId,
                            recurringExpenseId,
                          })
                          toast.success("Recurring expense deleted.")
                          await navigate({
                            params: { planId },
                            to: "/plans/$planId/recurring-expenses",
                          })
                        } catch (error) {
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : "Failed to delete recurring expense."
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
