import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import {
  CreateRecurringExpenseDtoDayRule,
  CreateRecurringExpenseDtoFrequency,
} from "@/api/generated/model"
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
  isPositiveIntegerListValid,
  parsePositiveIntegerList,
  toOptionalPositiveInteger,
  toOptionalPositiveNumber,
  toOptionalString,
} from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute("/plans/$planId/recurring-expenses/new")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(planQueries.accounts(params.planId)),
      context.queryClient.ensureQueryData(
        planQueries.categories(params.planId)
      ),
    ]),
  pendingComponent: ResourcePageSkeleton,
  component: NewRecurringExpensePage,
})

const frequencies = Object.values(CreateRecurringExpenseDtoFrequency)
const dayRules = Object.values(CreateRecurringExpenseDtoDayRule)
type DayRuleValue = (typeof dayRules)[number] | "none"

function NewRecurringExpensePage() {
  const navigate = useNavigate()
  const { planId } = Route.useParams()
  const { data: accounts } = useSuspenseQuery(planQueries.accounts(planId))
  const { data: categories } = useSuspenseQuery(planQueries.categories(planId))
  const createMutation = useMutation(planMutations.createRecurringExpense())
  const [form, setForm] = useState({
    account: "none",
    amount: "",
    category: "none",
    concept: "",
    date: "",
    day: "",
    dayRule: "none" as DayRuleValue,
    days: "",
    frequency: CreateRecurringExpenseDtoFrequency.monthly,
    fundingAccount: "none",
  })

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">New recurring expense</h1>
          <p className="text-sm text-muted-foreground">
            Create a periodic obligation for the plan.
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
          <CardTitle>Expense details</CardTitle>
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
                setForm((current) => ({ ...current, day: value }))
              }
              type="number"
              value={form.day}
            />
          </FieldShell>
          <FieldShell label="Days (comma separated)">
            <TextField
              onChange={(value) =>
                setForm((current) => ({ ...current, days: value }))
              }
              placeholder="1, 15"
              value={form.days}
            />
          </FieldShell>
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
          </FieldShell>
          <FormError error={createMutation.error} />
          <Button
            className="w-fit"
            disabled={
              createMutation.isPending ||
              !form.concept.trim() ||
              !form.amount.trim() ||
              toOptionalPositiveNumber(form.amount) === undefined ||
              (Boolean(form.day.trim()) &&
                toOptionalPositiveInteger(form.day) === undefined) ||
              (Boolean(form.days.trim()) &&
                !isPositiveIntegerListValid(form.days))
            }
            onClick={() =>
              void (async () => {
                try {
                  await createMutation.mutateAsync({
                    planId,
                    data: {
                      account:
                        form.account === "none" ? undefined : form.account,
                      amount: toOptionalPositiveNumber(form.amount)!,
                      category:
                        form.category === "none" ? undefined : form.category,
                      concept: form.concept,
                      date: toOptionalString(form.date),
                      day: toOptionalPositiveInteger(form.day),
                      dayRule:
                        form.dayRule === "none" ? undefined : form.dayRule,
                      days: form.days.trim()
                        ? parsePositiveIntegerList(form.days)
                        : undefined,
                      frequency: form.frequency,
                      fundingAccount:
                        form.fundingAccount === "none"
                          ? undefined
                          : form.fundingAccount,
                    },
                  })
                  toast.success("Recurring expense created.")
                  await navigate({
                    params: { planId },
                    to: "/plans/$planId/recurring-expenses",
                  })
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Failed to create recurring expense."
                  )
                }
              })()
            }
            type="button"
          >
            <Plus />
            Create expense
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
