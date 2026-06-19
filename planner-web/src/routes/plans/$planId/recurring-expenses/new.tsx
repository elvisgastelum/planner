import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Plus } from "lucide-react"
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
import { toOptionalPositiveNumber } from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute("/plans/$planId/recurring-expenses/new")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        planQueries.categories(params.planId)
      ),
    ]),
  pendingComponent: ResourcePageSkeleton,
  component: NewRecurringItemPage,
})

function NewRecurringItemPage() {
  const navigate = useNavigate()
  const { planId } = Route.useParams()
  const { data: categories } = useSuspenseQuery(planQueries.categories(planId))
  const createMutation = useMutation(planMutations.createRecurringItem())
  const [form, setForm] = useState({
    amountCents: "",
    categoryId: "none",
    concept: "",
    recurrenceRule: "",
  })

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">New recurring item</h1>
          <p className="text-sm text-muted-foreground">
            Create a recurring item for the plan.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link params={{ planId }} to="/plans/$planId/recurring-expenses">
            <ArrowLeft />
            Back to recurring items
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Recurring item details</CardTitle>
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
          <FieldShell label="Amount (cents)">
            <TextField
              onChange={(value) =>
                setForm((current) => ({ ...current, amountCents: value }))
              }
              placeholder="e.g. 5000 for $50"
              value={form.amountCents}
            />
          </FieldShell>
          <FieldShell label="Recurrence rule">
            <TextField
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  recurrenceRule: value,
                }))
              }
              placeholder="e.g. FREQ=MONTHLY;BYMONTHDAY=15"
              value={form.recurrenceRule}
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
          <FormError error={createMutation.error} />
          <Button
            className="w-fit"
            disabled={
              createMutation.isPending ||
              !form.concept.trim() ||
              !form.amountCents.trim() ||
              toOptionalPositiveNumber(form.amountCents) === undefined ||
              !form.recurrenceRule.trim()
            }
            onClick={() =>
              void (async () => {
                try {
                  await createMutation.mutateAsync({
                    planId,
                    data: {
                      amountCents: parseInt(form.amountCents),
                      concept: form.concept,
                      itemType: "expense",
                      recurrenceRule: form.recurrenceRule,
                      ...(form.categoryId !== "none"
                        ? { categoryId: form.categoryId }
                        : {}),
                    },
                  })
                  toast.success("Recurring item created.")
                  await navigate({
                    params: { planId },
                    to: "/plans/$planId/recurring-expenses",
                  })
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Failed to create recurring item."
                  )
                }
              })()
            }
            type="button"
          >
            <Plus />
            Create recurring item
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
