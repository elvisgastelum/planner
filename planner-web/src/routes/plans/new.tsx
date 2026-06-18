import { useMutation } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs"
import type { FormEvent } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { DatePicker } from "@/components/ui/date-picker"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { planMutations } from "@/features/plans/data-access/plan.mutations"
import { TextAreaField } from "@/features/plans/plan-ui"
import { cn } from "@/lib/utils"

const planWizardParsers = {
  baseCurrency: parseAsString.withDefault("MXN"),
  endDate: parseAsString.withDefault(""),
  metadataId: parseAsString.withDefault(""),
  name: parseAsString.withDefault(""),
  objective: parseAsString.withDefault(""),
  startDate: parseAsString.withDefault(""),
  status: parseAsStringLiteral(["active", "archived", "draft"]).withDefault(
    "active"
  ),
  step: parseAsInteger.withDefault(1),
}

export const Route = createFileRoute("/plans/new")({
  component: CreatePlanPage,
})

type PlanWizardState = {
  baseCurrency: string
  endDate: string
  metadataId: string
  name: string
  objective: string
  startDate: string
  status: "active" | "archived" | "draft"
  step: number
}

function CreatePlanPage() {
  const navigate = useNavigate()
  const createPlanMutation = useMutation(planMutations.create())
  const [wizard, setWizard] = useQueryStates(planWizardParsers, {
    history: "replace",
  })

  async function handleCreatePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const plan = await createPlanMutation.mutateAsync({
      baseCurrency: wizard.baseCurrency || undefined,
      endDate: wizard.endDate || undefined,
      metadataId: wizard.metadataId,
      name: wizard.name,
      objective: wizard.objective || undefined,
      startDate: wizard.startDate,
      status: wizard.status,
    })

    await setWizard(null)
    await navigate({ params: { planId: plan.id }, to: "/plans/$planId" })
  }

  const step = Math.min(Math.max(wizard.step, 1), 3)
  const canGoBack = step > 1
  const canContinueFromDetails = Boolean(wizard.metadataId && wizard.name)
  const canContinue = step === 1 ? canContinueFromDetails : true
  const canSubmit = Boolean(
    wizard.metadataId && wizard.name && wizard.startDate && wizard.baseCurrency
  )

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link to="/plans">
            <ArrowLeft />
            Back to plans
          </Link>
        </Button>
      </header>

      <form onSubmit={handleCreatePlan}>
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Create plan</h2>
                <p className="text-sm text-muted-foreground">
                  Draft state is persisted in the URL so you can refresh or
                  share progress. Avoid entering sensitive financial details.
                </p>
              </div>
              <ol className="flex flex-wrap gap-2 text-xs">
                {["Details", "Dates", "Review"].map((label, index) => {
                  const stepNumber = index + 1
                  const isActive = stepNumber === step

                  return (
                    <li key={label}>
                      <Badge variant={isActive ? "default" : "secondary"}>
                        {stepNumber}. {label}
                      </Badge>
                    </li>
                  )
                })}
              </ol>
            </div>
          </CardHeader>
          <CardContent>
            {step === 1 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <FieldShell label="Metadata ID">
                  <Input
                    onChange={(event) =>
                      void setWizard({ metadataId: event.currentTarget.value })
                    }
                    placeholder="plan-2026"
                    required
                    value={wizard.metadataId}
                  />
                </FieldShell>
                <FieldShell label="Plan name">
                  <Input
                    onChange={(event) =>
                      void setWizard({ name: event.currentTarget.value })
                    }
                    placeholder="2026 financial plan"
                    required
                    value={wizard.name}
                  />
                </FieldShell>
                 <FieldShell label="Base currency">
                   <Input
                     onChange={(event) =>
                       void setWizard({ baseCurrency: event.currentTarget.value })
                     }
                     placeholder="MXN"
                     required
                     value={wizard.baseCurrency}
                   />
                 </FieldShell>
                <FieldShell label="Status">
                  <Select
                    onValueChange={(value) =>
                      void setWizard({
                        status: value as PlanWizardState["status"],
                      })
                    }
                    value={wizard.status}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </FieldShell>
              </div>
            ) : null}

            {step === 2 ? (
              <div className="grid gap-4 md:grid-cols-2">
                <FieldShell label="Start date">
                  <DatePicker
                    onChange={(value) => void setWizard({ startDate: value })}
                    required
                    value={wizard.startDate}
                  />
                </FieldShell>
                <FieldShell label="End date">
                  <DatePicker
                    onChange={(value) => void setWizard({ endDate: value })}
                    value={wizard.endDate}
                  />
                </FieldShell>
                <FieldShell className="md:col-span-2" label="Objective">
                  <TextAreaField
                    className="min-h-24"
                    onChange={(value) => void setWizard({ objective: value })}
                    placeholder="Optional high-level goal"
                    value={wizard.objective}
                  />
                </FieldShell>
              </div>
            ) : null}

            {step === 3 ? (
              <dl className="grid gap-3 rounded-xl border bg-background p-4 text-sm md:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground">Metadata ID</dt>
                  <dd className="mt-1 font-medium break-words">
                    {wizard.metadataId}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Name</dt>
                  <dd className="mt-1 font-medium break-words">
                    {wizard.name}
                  </dd>
                </div>
                 <div>
                   <dt className="text-muted-foreground">Base currency</dt>
                   <dd className="mt-1 font-medium break-words">
                     {wizard.baseCurrency}
                   </dd>
                 </div>
                <div>
                  <dt className="text-muted-foreground">Status</dt>
                  <dd className="mt-1 font-medium break-words">
                    {wizard.status}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Start date</dt>
                  <dd className="mt-1 font-medium break-words">
                    {wizard.startDate}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">End date</dt>
                  <dd className="mt-1 font-medium break-words">
                    {wizard.endDate || "None"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground">Objective</dt>
                  <dd className="mt-1 font-medium break-words">
                    {wizard.objective || "No objective provided"}
                  </dd>
                </div>
              </dl>
            ) : null}

            <div className="mt-6 flex flex-col gap-3">
              {createPlanMutation.error ? (
                <p className="text-sm text-destructive">
                  {createPlanMutation.error.message}
                </p>
              ) : null}
              <div className="flex flex-wrap justify-between gap-2">
                <Button
                  onClick={() => void setWizard(null)}
                  type="button"
                  variant="ghost"
                >
                  Cancel
                </Button>
                <div className="flex gap-2">
                  <Button
                    disabled={!canGoBack || createPlanMutation.isPending}
                    onClick={() => void setWizard({ step: step - 1 })}
                    type="button"
                    variant="outline"
                  >
                    Back
                  </Button>
                  {step === 3 ? (
                    <Button
                      disabled={!canSubmit || createPlanMutation.isPending}
                      type="submit"
                    >
                      {createPlanMutation.isPending
                        ? "Working..."
                        : "Create plan"}
                    </Button>
                  ) : (
                    <Button
                      disabled={!canContinue || createPlanMutation.isPending}
                      onClick={() => void setWizard({ step: step + 1 })}
                      type="button"
                    >
                      Continue
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </form>
    </main>
  )
}

function FieldShell({
  children,
  className,
  label,
}: {
  children: React.ReactNode
  className?: string
  label: string
}) {
  return (
    <div className={cn("flex flex-col gap-2", className)}>
      <Label>{label}</Label>
      {children}
    </div>
  )
}
