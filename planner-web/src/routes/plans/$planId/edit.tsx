import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { ArrowLeft, Save } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

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
  FieldShell,
  FormError,
  ResourcePageSkeleton,
  StatusBadge,
  TextAreaField,
  TextField,
} from "@/features/plans/plan-ui"
import { readText } from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute("/plans/$planId/edit")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(planQueries.detail(params.planId)),
  pendingComponent: ResourcePageSkeleton,
  component: PlanEditPage,
})

type PlanFormState = {
  metadataId: string
  name: string
  baseCurrency: string
  startDate: string
  endDate: string
  status: "active" | "archived" | "draft"
  objective: string
}

function PlanEditPage() {
  const { planId } = Route.useParams()
  const { data: plan } = useSuspenseQuery(planQueries.detail(planId))

  return <PlanEditForm key={plan.id} plan={plan} />
}

function PlanEditForm({
  plan,
}: {
  plan: {
    baseCurrency: string
    endDate: string | null
    id: string
    metadataId: string
    name: string
    objective: string | null
    schemaVersion: string
    startDate: string
    status: "active" | "archived" | "draft"
  }
}) {
  const updatePlanMutation = useMutation(planMutations.update())
  const [form, setForm] = useState<PlanFormState>({
    metadataId: readText(plan.metadataId),
    name: readText(plan.name),
    baseCurrency: readText(plan.baseCurrency),
    startDate: readText(plan.startDate),
    endDate: readText(plan.endDate),
    status: plan.status,
    objective: readText(plan.objective),
  })

  async function handleSave() {
    try {
      await updatePlanMutation.mutateAsync({
        planId: plan.id,
        data: {
          baseCurrency: form.baseCurrency,
          endDate: form.endDate.trim() ? form.endDate : null,
          metadataId: form.metadataId,
          name: form.name,
          objective: form.objective.trim() ? form.objective : null,
          startDate: form.startDate,
          status: form.status,
        },
      })
      toast.success("Plan updated.")
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update plan."
      )
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-semibold">Edit plan</h1>
            <StatusBadge value={plan.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            Update the plan metadata and high-level settings.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link params={{ planId: plan.id }} to="/plans/$planId">
            <ArrowLeft />
            Back to overview
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Plan settings</CardTitle>
          <CardDescription>
            This page only edits the top-level plan metadata.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FieldShell label="Metadata ID">
            <TextField
              onChange={(value) =>
                setForm((current) => ({ ...current, metadataId: value }))
              }
              value={form.metadataId}
            />
          </FieldShell>
          <FieldShell label="Plan name">
            <TextField
              onChange={(value) =>
                setForm((current) => ({ ...current, name: value }))
              }
              value={form.name}
            />
          </FieldShell>
          <FieldShell label="Base currency">
            <TextField
              onChange={(value) =>
                setForm((current) => ({ ...current, baseCurrency: value }))
              }
              value={form.baseCurrency}
            />
          </FieldShell>
          <FieldShell label="Status">
            <Select
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  status: value as PlanFormState["status"],
                }))
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
                setForm((current) => ({ ...current, startDate: value }))
              }
              required
              value={form.startDate}
            />
          </FieldShell>
          <FieldShell label="End date">
            <DatePicker
              onChange={(value) =>
                setForm((current) => ({ ...current, endDate: value }))
              }
              value={form.endDate}
            />
          </FieldShell>
          <FieldShell className="md:col-span-2" label="Objective">
            <TextAreaField
              className="min-h-28"
              onChange={(value) =>
                setForm((current) => ({ ...current, objective: value }))
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
                <Save />
                {updatePlanMutation.isPending ? "Saving..." : "Save changes"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
