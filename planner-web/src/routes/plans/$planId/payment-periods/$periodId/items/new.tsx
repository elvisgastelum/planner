import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import type { CreateBudgetItemDtoRolloverPolicy } from "@/api/generated/model"
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
import { toOptionalPositiveNumber, toOptionalString } from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute(
  "/plans/$planId/payment-periods/$periodId/items/new"
)({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        planQueries.budgetPeriods(params.planId)
      ),
      context.queryClient.ensureQueryData(
        planQueries.categories(params.planId)
      ),
    ]),
  pendingComponent: ResourcePageSkeleton,
  component: NewBudgetItemPage,
})

const rolloverPolicyOptions: readonly CreateBudgetItemDtoRolloverPolicy[] = [
  "rollover",
  "expire",
  "treat_as_spent",
]

function NewBudgetItemPage() {
  const navigate = useNavigate()
  const { periodId, planId } = Route.useParams()
  const { data: periods } = useSuspenseQuery(
    planQueries.budgetPeriods(planId)
  )
  const { data: categories } = useSuspenseQuery(
    planQueries.categories(planId)
  )
  const createMutation = useMutation(planMutations.createBudgetItem())
  const period = periods.find((p: { id: string }) => p.id === periodId)
  const [form, setForm] = useState({
    categoryId: "none",
    concept: "",
    dueOn: period?.startsOn ?? "",
    notes: "",
    plannedAmountCents: "",
    rolloverPolicy: "rollover" as CreateBudgetItemDtoRolloverPolicy,
  })

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">New budget item</h1>
          <p className="text-sm text-muted-foreground">
            Create a budget item for this period.
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
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FieldShell label="Concept">
            <TextField
              onChange={(value) =>
                setForm((current) => ({ ...current, concept: value }))
              }
              value={form.concept}
            />
          </FieldShell>
          <FieldShell label="Due on">
            <DatePicker
              onChange={(value) =>
                setForm((current) => ({ ...current, dueOn: value }))
              }
              required
              value={form.dueOn}
            />
          </FieldShell>
          <FieldShell label="Planned amount (cents)">
            <TextField
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  plannedAmountCents: value,
                }))
              }
              placeholder="e.g. 5000 for $50"
              value={form.plannedAmountCents}
            />
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
                {categories.map((category: { id: string; name: string }) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>
          <FieldShell label="Rollover policy">
            <Select
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  rolloverPolicy: value as CreateBudgetItemDtoRolloverPolicy,
                }))
              }
              value={form.rolloverPolicy}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select policy" />
              </SelectTrigger>
              <SelectContent>
                {rolloverPolicyOptions.map((policy) => (
                  <SelectItem key={policy} value={policy}>
                    {policy}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>
          <FieldShell className="md:col-span-2" label="Notes">
            <TextField
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
              !form.concept.trim() ||
              !form.plannedAmountCents.trim() ||
              toOptionalPositiveNumber(form.plannedAmountCents) === undefined
            }
            onClick={() =>
              void (async () => {
                try {
                  await createMutation.mutateAsync({
                    planId,
                    periodId,
                    data: {
                      concept: form.concept,
                      dueOn: form.dueOn,
                      notes: toOptionalString(form.notes),
                      plannedAmountCents: parseInt(form.plannedAmountCents),
                      rolloverPolicy: form.rolloverPolicy,
                      ...(form.categoryId !== "none"
                        ? { categoryId: form.categoryId }
                        : {}),
                    },
                  })
                  toast.success("Budget item created.")
                  await navigate({
                    params: { periodId, planId },
                    to: "/plans/$planId/payment-periods/$periodId",
                  })
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Failed to create budget item."
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
