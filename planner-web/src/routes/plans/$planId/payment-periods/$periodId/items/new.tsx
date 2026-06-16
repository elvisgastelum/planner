import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import { CreatePaymentPeriodItemDtoStatus } from "@/api/generated/model"
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
import { TextAreaField } from "@/features/plans/plan-ui"
import {
  FieldShell,
  FormError,
  ResourcePageSkeleton,
  TextField,
} from "@/features/plans/plan-ui"
import {
  toOptionalPositiveNumber,
  toOptionalString,
} from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute(
  "/plans/$planId/payment-periods/$periodId/items/new"
)({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        planQueries.paymentPeriod(params.periodId)
      ),
      context.queryClient.ensureQueryData(planQueries.accounts(params.planId)),
      context.queryClient.ensureQueryData(
        planQueries.categories(params.planId)
      ),
    ]),
  pendingComponent: ResourcePageSkeleton,
  component: NewPaymentPeriodItemPage,
})

const itemStatuses = Object.values(CreatePaymentPeriodItemDtoStatus)

function NewPaymentPeriodItemPage() {
  const navigate = useNavigate()
  const { periodId, planId } = Route.useParams()
  const { data: period } = useSuspenseQuery(planQueries.paymentPeriod(periodId))
  const { data: accounts } = useSuspenseQuery(planQueries.accounts(planId))
  const { data: categories } = useSuspenseQuery(planQueries.categories(planId))
  const createMutation = useMutation(planMutations.createPaymentPeriodItem())
  const [form, setForm] = useState({
    account: "none",
    actualAmount: "",
    categoryId: "none",
    concept: "",
    date: period.incomeDate,
    externalId: "",
    fundingAccount: "none",
    notes: "",
    plannedAmount: "",
    status: CreatePaymentPeriodItemDtoStatus.pending,
  })

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">New planned item</h1>
          <p className="text-sm text-muted-foreground">
            Create a planned item inside this period.
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
          <CardTitle>Item details</CardTitle>
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
                setForm((current) => ({ ...current, categoryId: value }))
              }
              value={form.categoryId}
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
          <FieldShell className="md:col-span-2 lg:col-span-3" label="Notes">
            <TextAreaField
              onChange={(value) =>
                setForm((current) => ({ ...current, notes: value }))
              }
              value={form.notes}
            />
          </FieldShell>
          <FormError error={createMutation.error} />
          <Button
            className="w-fit"
            disabled={
              createMutation.isPending ||
              !form.date ||
              !form.concept.trim() ||
              !form.plannedAmount.trim() ||
              toOptionalPositiveNumber(form.plannedAmount) === undefined
            }
            onClick={() =>
              void (async () => {
                try {
                  await createMutation.mutateAsync({
                    periodId,
                    planId,
                    data: {
                      account:
                        form.account === "none" ? undefined : form.account,
                      actualAmount: toOptionalPositiveNumber(form.actualAmount),
                      categoryId:
                        form.categoryId === "none"
                          ? undefined
                          : form.categoryId,
                      concept: form.concept,
                      date: form.date,
                      externalId: toOptionalString(form.externalId),
                      fundingAccount:
                        form.fundingAccount === "none"
                          ? undefined
                          : form.fundingAccount,
                      notes: toOptionalString(form.notes),
                      plannedAmount: toOptionalPositiveNumber(
                        form.plannedAmount
                      )!,
                      status: form.status,
                    },
                  })
                  toast.success("Planned item created.")
                  await navigate({
                    params: { periodId, planId },
                    to: "/plans/$planId/payment-periods/$periodId",
                  })
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Failed to create planned item."
                  )
                }
              })()
            }
            type="button"
          >
            <Plus />
            Create item
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
