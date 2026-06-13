import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { useState } from "react"

import { type FinancialPlanDetailResponseDto } from "@/api/generated/model"
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
import { mapPlanDetailToOverview } from "@/features/plans/data-access/plan.mappers"
import { planMutations } from "@/features/plans/data-access/plan.mutations"
import { planQueries } from "@/features/plans/data-access/plan.queries"
import {
  EmptyState,
  FieldShell,
  FormError,
  PlanOverviewSkeleton,
  StatusBadge,
  TextAreaField,
  TextField,
} from "@/features/plans/plan-ui"
import { formatCurrency, readText } from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute("/plans/$planId/")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(planQueries.detail(params.planId)),
  pendingComponent: PlanOverviewSkeleton,
  component: RouteComponent,
})

type PlanFormState = {
  metadataId: string
  name: string
  currency: string
  startDate: string
  endDate: string
  status: "active" | "archived" | "draft"
  objective: string
}

function RouteComponent() {
  const navigate = useNavigate()
  const { planId } = Route.useParams()
  const { data: plan } = useSuspenseQuery(planQueries.detail(planId))
  const updatePlanMutation = useMutation(planMutations.update())
  const deletePlanMutation = useMutation(planMutations.delete())
  const [form, setForm] = useState<PlanFormState | null>(
    mapPlanDetailToPlanFormState(plan)
  )

  if (!form) {
    return null
  }

  const overview = mapPlanDetailToOverview(plan)
  const currentForm = form

  async function handleSave() {
    await updatePlanMutation.mutateAsync({
      planId: plan.id,
      data: {
        currency: currentForm.currency,
        endDate: currentForm.endDate.trim() ? currentForm.endDate : null,
        metadataId: currentForm.metadataId,
        name: currentForm.name,
        objective: currentForm.objective.trim() ? currentForm.objective : null,
        startDate: currentForm.startDate,
        status: currentForm.status,
      },
    })
  }

  async function handleDelete() {
    const confirmed = window.confirm(
      `Delete financial plan "${plan.name}"? This cannot be undone.`
    )

    if (!confirmed) {
      return
    }

    await deletePlanMutation.mutateAsync(plan.id)
    await navigate({ to: "/plans" })
  }

  async function handleStatusChange(value: PlanFormState["status"]) {
    setForm((current) => (current ? { ...current, status: value } : current))

    await updatePlanMutation.mutateAsync({
      planId: plan.id,
      data: { status: value },
    })
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">{overview.name}</h1>
            <StatusBadge value={overview.status} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {overview.currency} · starts {overview.startDate}
          </p>
        </div>
        <nav className="flex flex-wrap gap-2 text-sm">
          <Link
            className="rounded-full border px-3 py-1 hover:bg-accent"
            params={{ planId: plan.id }}
            to="/plans/$planId/accounts"
          >
            Accounts
          </Link>
          <Link
            className="rounded-full border px-3 py-1 hover:bg-accent"
            params={{ planId: plan.id }}
            to="/plans/$planId/categories"
          >
            Categories
          </Link>
          <Link
            className="rounded-full border px-3 py-1 hover:bg-accent"
            params={{ planId: plan.id }}
            to="/plans/$planId/income"
          >
            Income
          </Link>
          <Link
            className="rounded-full border px-3 py-1 hover:bg-accent"
            params={{ planId: plan.id }}
            to="/plans/$planId/payment-periods"
          >
            Payment periods
          </Link>
          <Link
            className="rounded-full border px-3 py-1 hover:bg-accent"
            params={{ planId: plan.id }}
            to="/plans/$planId/recurring-expenses"
          >
            Recurring expenses
          </Link>
        </nav>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <MetricCard
          label="Planned total"
          value={formatCurrency(overview.plannedTotal, overview.currency)}
        />
        <MetricCard
          label="Remaining planned"
          value={formatCurrency(overview.plannedRemaining, overview.currency)}
        />
        <MetricCard
          label="Completed total"
          value={formatCurrency(overview.completedTotal, overview.currency)}
        />
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <MetricCard
          label="Accounts"
          value={overview.accountsCount.toString()}
        />
        <MetricCard
          label="Income payments"
          value={overview.incomePaymentsCount.toString()}
        />
        <MetricCard
          label="Payment periods"
          value={overview.paymentPeriodsCount.toString()}
        />
        <MetricCard
          label="Recurring expenses"
          value={overview.recurringExpensesCount.toString()}
        />
        <MetricCard
          label="Completed items"
          value={overview.completedItemsCount.toString()}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Edit plan</CardTitle>
            <CardDescription>
              Update the plan metadata and high-level settings.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <FieldShell label="Metadata ID">
              <TextField
                onChange={(value) =>
                  setForm((current) =>
                    current ? { ...current, metadataId: value } : current
                  )
                }
                value={form.metadataId}
              />
            </FieldShell>
            <FieldShell label="Plan name">
              <TextField
                onChange={(value) =>
                  setForm((current) =>
                    current ? { ...current, name: value } : current
                  )
                }
                value={form.name}
              />
            </FieldShell>
            <FieldShell label="Currency">
              <TextField
                onChange={(value) =>
                  setForm((current) =>
                    current ? { ...current, currency: value } : current
                  )
                }
                value={form.currency}
              />
            </FieldShell>
            <FieldShell label="Status">
              <Select
                onValueChange={(value) =>
                  void handleStatusChange(value as PlanFormState["status"])
                }
                value={form.status}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
            </FieldShell>
            <FieldShell label="Start date">
              <DatePicker
                onChange={(value) =>
                  setForm((current) =>
                    current ? { ...current, startDate: value } : current
                  )
                }
                required
                value={form.startDate}
              />
            </FieldShell>
            <FieldShell label="End date">
              <DatePicker
                onChange={(value) =>
                  setForm((current) =>
                    current ? { ...current, endDate: value } : current
                  )
                }
                value={form.endDate}
              />
            </FieldShell>
            <FieldShell className="md:col-span-2" label="Objective">
              <TextAreaField
                className="min-h-28"
                onChange={(value) =>
                  setForm((current) =>
                    current ? { ...current, objective: value } : current
                  )
                }
                value={form.objective}
              />
            </FieldShell>
            <div className="flex flex-col gap-3 md:col-span-2">
              <FormError error={updatePlanMutation.error} />
              <div className="flex flex-wrap gap-2">
                <Button
                  disabled={updatePlanMutation.isPending}
                  onClick={() => void handleSave()}
                  type="button"
                >
                  {updatePlanMutation.isPending ? "Saving..." : "Save changes"}
                </Button>
                <Button
                  disabled={deletePlanMutation.isPending}
                  onClick={() => void handleDelete()}
                  type="button"
                  variant="destructive"
                >
                  {deletePlanMutation.isPending ? "Deleting..." : "Delete plan"}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Next income date</CardTitle>
            </CardHeader>
            <CardContent className="text-lg font-medium">
              {overview.nextIncomeDate ?? "No upcoming income payment"}
            </CardContent>
          </Card>
          <EmptyState
            description="Use the linked workspaces to add accounts, income, payment periods, and recurring expenses to this plan."
            title="Plan workspaces"
          />
        </div>
      </section>
    </main>
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

function mapPlanDetailToPlanFormState(
  plan: FinancialPlanDetailResponseDto
): PlanFormState {
  return {
    metadataId: readText(plan.metadataId),
    name: readText(plan.name),
    currency: readText(plan.currency),
    startDate: readText(plan.startDate),
    endDate: readText(plan.endDate),
    status: plan.status,
    objective: readText(plan.objective),
  }
}
