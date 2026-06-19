import { useMutation } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

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

export const Route = createFileRoute("/plans/$planId/payment-periods/new")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      planQueries.budgetPeriods(params.planId)
    ),
  pendingComponent: ResourcePageSkeleton,
  component: NewBudgetPeriodPage,
})

const periodTypeOptions = ["monthly", "opening", "income", "manual"] as const
type PeriodType = (typeof periodTypeOptions)[number]

function NewBudgetPeriodPage() {
  const navigate = useNavigate()
  const { planId } = Route.useParams()
  const createMutation = useMutation(planMutations.createBudgetPeriod())
  const [form, setForm] = useState({
    endsOn: "",
    fundingAmountCents: "",
    periodType: "monthly" as PeriodType,
    startsOn: "",
  })

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">New budget period</h1>
          <p className="text-sm text-muted-foreground">
            Create a budget period for planning.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link params={{ planId }} to="/plans/$planId/payment-periods">
            <ArrowLeft />
            Back to periods
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Period details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FieldShell label="Period type">
            <Select
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  periodType: value as PeriodType,
                }))
              }
              value={form.periodType}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {periodTypeOptions.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>
          <FieldShell label="Starts on">
            <DatePicker
              onChange={(value) =>
                setForm((current) => ({ ...current, startsOn: value }))
              }
              required
              value={form.startsOn}
            />
          </FieldShell>
          <FieldShell label="Ends on">
            <DatePicker
              onChange={(value) =>
                setForm((current) => ({ ...current, endsOn: value }))
              }
              required
              value={form.endsOn}
            />
          </FieldShell>
          <FieldShell label="Funding amount (cents)">
            <TextField
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  fundingAmountCents: value,
                }))
              }
              placeholder="e.g. 500000 for $5000"
              value={form.fundingAmountCents}
            />
          </FieldShell>
          <FormError error={createMutation.error} />
          <Button
            className="w-fit"
            disabled={
              createMutation.isPending || !form.startsOn || !form.endsOn
            }
            onClick={() =>
              void (async () => {
                try {
                  await createMutation.mutateAsync({
                    planId,
                    data: {
                      endsOn: form.endsOn,
                      periodType: form.periodType,
                      startsOn: form.startsOn,
                      fundingAmountCents: form.fundingAmountCents
                        ? parseInt(form.fundingAmountCents)
                        : 0,
                    },
                  })
                  toast.success("Budget period created.")
                  await navigate({
                    params: { planId },
                    to: "/plans/$planId/payment-periods",
                  })
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Failed to create budget period."
                  )
                }
              })()
            }
            type="button"
          >
            <Plus />
            Create period
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
