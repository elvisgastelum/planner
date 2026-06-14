import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import {
  parseAsInteger,
  parseAsString,
  parseAsStringLiteral,
  useQueryStates,
} from "nuqs"
import type { FormEvent } from "react"
import { toast } from "sonner"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { planQueries } from "@/features/plans/data-access/plan.queries"
import { StatusActionMenu } from "@/features/plans/plan-actions"
import { PlansPageSkeleton, TextAreaField } from "@/features/plans/plan-ui"
import { cn } from "@/lib/utils"

const planWizardParsers = {
  currency: parseAsString.withDefault("MXN"),
  endDate: parseAsString.withDefault(""),
  flow: parseAsStringLiteral(["create", "import"]),
  importPath: parseAsString.withDefault(""),
  metadataId: parseAsString.withDefault(""),
  name: parseAsString.withDefault(""),
  objective: parseAsString.withDefault(""),
  startDate: parseAsString.withDefault(""),
  status: parseAsStringLiteral(["active", "archived", "draft"]).withDefault(
    "active"
  ),
  step: parseAsInteger.withDefault(1),
}

export const Route = createFileRoute("/plans/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(planQueries.list()),
  pendingComponent: PlansPageSkeleton,
  errorComponent: ({ error, reset }) => (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <p className="text-sm font-medium text-destructive">Plans</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {error.message}
            </p>
          </div>
          <Button onClick={reset} type="button">
            Retry
          </Button>
        </CardContent>
      </Card>
    </main>
  ),
  component: PlansPage,
})

function PlansPage() {
  const navigate = useNavigate()
  const { data: plans } = useSuspenseQuery(planQueries.list())
  const createPlanMutation = useMutation(planMutations.create())
  const updatePlanMutation = useMutation(planMutations.update())
  const importJsonMutation = useMutation(planMutations.importJson())
  const [wizard, setWizard] = useQueryStates(planWizardParsers, {
    history: "replace",
  })

  const isCreateFlow = wizard.flow === "create"
  const isImportFlow = wizard.flow === "import"

  async function clearWizard() {
    await setWizard(null)
  }

  async function startFlow(flow: "create" | "import") {
    await setWizard({ flow, step: 1 })
  }

  async function handleCreatePlan(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const plan = await createPlanMutation.mutateAsync({
      currency: wizard.currency || undefined,
      endDate: wizard.endDate || undefined,
      metadataId: wizard.metadataId,
      name: wizard.name,
      objective: wizard.objective || undefined,
      startDate: wizard.startDate,
      status: wizard.status,
    })

    await clearWizard()
    await navigate({ params: { planId: plan.id }, to: "/plans/$planId" })
  }

  async function handleImportJson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const result = await importJsonMutation.mutateAsync({
      path: wizard.importPath || undefined,
    })

    await clearWizard()
    await navigate({ params: { planId: result.id }, to: "/plans/$planId" })
  }

  async function handlePlanStatusChange(
    planId: string,
    status: "active" | "archived" | "draft"
  ) {
    try {
      await updatePlanMutation.mutateAsync({
        data: { status },
        planId,
      })
      toast.success(`Plan updated to ${status}.`)
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to update plan."
      )
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Financial plans</h1>
          <p className="text-sm text-muted-foreground">
            Select a plan, create a new plan, or import a backend JSON plan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => void startFlow("create")}
            type="button"
            variant={isCreateFlow ? "default" : "outline"}
          >
            Create plan
          </Button>
          <Button
            onClick={() => void startFlow("import")}
            type="button"
            variant={isImportFlow ? "default" : "outline"}
          >
            Import JSON
          </Button>
        </div>
      </div>

      {isCreateFlow ? (
        <CreatePlanWizard
          error={createPlanMutation.error}
          isPending={createPlanMutation.isPending}
          onCancel={() => void clearWizard()}
          onSubmit={(event) => void handleCreatePlan(event)}
          setWizard={setWizard}
          wizard={wizard}
        />
      ) : null}

      {isImportFlow ? (
        <ImportJsonWizard
          error={importJsonMutation.error}
          isPending={importJsonMutation.isPending}
          onCancel={() => void clearWizard()}
          onSubmit={(event) => void handleImportJson(event)}
          setWizard={setWizard}
          wizard={wizard}
        />
      ) : null}

      {plans.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            No plans found. Create or import a plan to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              className="h-full transition-colors hover:bg-accent/10"
              key={plan.id}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="leading-tight">
                      <Link
                        className="transition-colors outline-none hover:text-primary focus-visible:underline"
                        params={{ planId: plan.id }}
                        to="/plans/$planId"
                      >
                        {plan.name}
                      </Link>
                    </CardTitle>
                    <CardDescription>
                      {plan.currency} · starts {plan.startDate}
                    </CardDescription>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{plan.status}</Badge>
                    <StatusActionMenu
                      actions={
                        plan.status === "active"
                          ? [
                              {
                                confirmDescription:
                                  "Move this plan to archived status.",
                                confirmTitle: "Archive plan",
                                label: "Archive",
                                targetStatus: "archived",
                                variant: "destructive",
                              },
                            ]
                          : plan.status === "draft"
                            ? [
                                {
                                  label: "Activate",
                                  targetStatus: "active",
                                },
                                {
                                  confirmDescription:
                                    "Archive this draft plan.",
                                  confirmTitle: "Archive plan",
                                  label: "Archive",
                                  targetStatus: "archived",
                                  variant: "destructive",
                                },
                              ]
                            : [
                                {
                                  label: "Activate",
                                  targetStatus: "active",
                                },
                              ]
                      }
                      disabled={updatePlanMutation.isPending}
                      onStatusChange={(status) =>
                        handlePlanStatusChange(plan.id, status)
                      }
                    />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex justify-end pt-0">
                <Button asChild size="sm" variant="outline">
                  <Link params={{ planId: plan.id }} to="/plans/$planId">
                    Open
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}

type PlanWizardState = {
  currency: string
  endDate: string
  flow: "create" | "import" | null
  importPath: string
  metadataId: string
  name: string
  objective: string
  startDate: string
  status: "active" | "archived" | "draft"
  step: number
}
type SetPlanWizardState = (
  values: Partial<PlanWizardState> | null
) => Promise<URLSearchParams>

function CreatePlanWizard({
  error,
  isPending,
  onCancel,
  onSubmit,
  setWizard,
  wizard,
}: {
  error: Error | null
  isPending: boolean
  onCancel: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  setWizard: SetPlanWizardState
  wizard: PlanWizardState
}) {
  const step = Math.min(Math.max(wizard.step, 1), 3)
  const canContinueFromDetails = Boolean(wizard.metadataId && wizard.name)
  const canSubmit = Boolean(
    wizard.metadataId && wizard.name && wizard.startDate && wizard.currency
  )

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <WizardHeader
            description="Draft state is persisted in the URL so you can refresh or share progress. Avoid entering sensitive financial details."
            step={step}
            steps={["Details", "Dates", "Review"]}
            title="Create plan"
          />
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <div className="grid gap-4 md:grid-cols-2">
              <TextField
                label="Metadata ID"
                onChange={(value) => void setWizard({ metadataId: value })}
                placeholder="plan-2026"
                required
                value={wizard.metadataId}
              />
              <TextField
                label="Plan name"
                onChange={(value) => void setWizard({ name: value })}
                placeholder="2026 financial plan"
                required
                value={wizard.name}
              />
              <TextField
                label="Currency"
                onChange={(value) => void setWizard({ currency: value })}
                placeholder="MXN"
                required
                value={wizard.currency}
              />
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
              <DateField
                label="Start date"
                onChange={(value) => void setWizard({ startDate: value })}
                required
                value={wizard.startDate}
              />
              <DateField
                label="End date"
                onChange={(value) => void setWizard({ endDate: value })}
                value={wizard.endDate}
              />
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

          {step === 3 ? <CreatePlanReview wizard={wizard} /> : null}

          <WizardActions
            canGoBack={step > 1}
            canGoNext={step === 1 ? canContinueFromDetails : true}
            canSubmit={canSubmit}
            error={error}
            isPending={isPending}
            onBack={() => void setWizard({ step: step - 1 })}
            onCancel={onCancel}
            onNext={() => void setWizard({ step: step + 1 })}
            showSubmit={step === 3}
            submitLabel="Create plan"
          />
        </CardContent>
      </Card>
    </form>
  )
}

function ImportJsonWizard({
  error,
  isPending,
  onCancel,
  onSubmit,
  setWizard,
  wizard,
}: {
  error: Error | null
  isPending: boolean
  onCancel: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  setWizard: SetPlanWizardState
  wizard: PlanWizardState
}) {
  const step = Math.min(Math.max(wizard.step, 1), 2)

  return (
    <form onSubmit={onSubmit}>
      <Card>
        <CardHeader>
          <WizardHeader
            description="The current planner-api imports JSON from a backend-readable path. Leave the path blank to use the API default."
            step={step}
            steps={["Source", "Review"]}
            title="Import JSON"
          />
        </CardHeader>
        <CardContent>
          {step === 1 ? (
            <div>
              <TextField
                label="Backend JSON path"
                onChange={(value) => void setWizard({ importPath: value })}
                placeholder="src/plan-financiero.json"
                value={wizard.importPath}
              />
              <p className="mt-2 text-xs text-muted-foreground">
                This is not a browser upload. The file must be readable by the
                API process.
              </p>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="rounded-xl border bg-background p-4 text-sm">
              <p className="text-muted-foreground">Import source</p>
              <p className="mt-1 font-medium">
                {wizard.importPath || "API default: src/plan-financiero.json"}
              </p>
            </div>
          ) : null}

          <WizardActions
            canGoBack={step > 1}
            canGoNext
            canSubmit
            error={error}
            isPending={isPending}
            onBack={() => void setWizard({ step: step - 1 })}
            onCancel={onCancel}
            onNext={() => void setWizard({ step: step + 1 })}
            showSubmit={step === 2}
            submitLabel="Import plan"
          />
        </CardContent>
      </Card>
    </form>
  )
}

function WizardHeader({
  description,
  step,
  steps,
  title,
}: {
  description: string
  step: number
  steps: string[]
  title: string
}) {
  const safeStep = Math.min(Math.max(step, 1), steps.length)

  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
      <div>
        <h2 className="text-lg font-semibold">{title}</h2>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <ol className="flex flex-wrap gap-2 text-xs">
        {steps.map((label, index) => {
          const stepNumber = index + 1
          const isActive = stepNumber === safeStep

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
  )
}

function WizardActions({
  canGoBack,
  canGoNext,
  canSubmit,
  error,
  isPending,
  onBack,
  onCancel,
  onNext,
  showSubmit,
  submitLabel,
}: {
  canGoBack: boolean
  canGoNext: boolean
  canSubmit: boolean
  error: Error | null
  isPending: boolean
  onBack: () => void
  onCancel: () => void
  onNext: () => void
  showSubmit: boolean
  submitLabel: string
}) {
  return (
    <div className="mt-6 flex flex-col gap-3">
      {error ? (
        <p className="text-sm text-destructive">{error.message}</p>
      ) : null}
      <div className="flex flex-wrap justify-between gap-2">
        <Button onClick={onCancel} type="button" variant="ghost">
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button
            disabled={!canGoBack || isPending}
            onClick={onBack}
            type="button"
            variant="outline"
          >
            Back
          </Button>
          {showSubmit ? (
            <Button disabled={!canSubmit || isPending} type="submit">
              {isPending ? "Working..." : submitLabel}
            </Button>
          ) : (
            <Button
              disabled={!canGoNext || isPending}
              onClick={onNext}
              type="button"
            >
              Continue
            </Button>
          )}
        </div>
      </div>
    </div>
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

function TextField({
  label,
  onChange,
  placeholder,
  required = false,
  value,
}: {
  label: string
  onChange: (value: string) => void
  placeholder?: string
  required?: boolean
  value: string
}) {
  return (
    <FieldShell label={label}>
      <Input
        onChange={(event) => onChange(event.currentTarget.value)}
        placeholder={placeholder}
        required={required}
        value={value}
      />
    </FieldShell>
  )
}

function DateField({
  label,
  onChange,
  required = false,
  value,
}: {
  label: string
  onChange: (value: string) => void
  required?: boolean
  value: string
}) {
  return (
    <FieldShell label={label}>
      <DatePicker onChange={onChange} required={required} value={value} />
    </FieldShell>
  )
}

function CreatePlanReview({ wizard }: { wizard: PlanWizardState }) {
  return (
    <dl className="grid gap-3 rounded-xl border bg-background p-4 text-sm md:grid-cols-2">
      <ReviewItem label="Metadata ID" value={wizard.metadataId} />
      <ReviewItem label="Name" value={wizard.name} />
      <ReviewItem label="Currency" value={wizard.currency} />
      <ReviewItem label="Status" value={wizard.status} />
      <ReviewItem label="Start date" value={wizard.startDate} />
      <ReviewItem label="End date" value={wizard.endDate || "None"} />
      <ReviewItem
        label="Objective"
        value={wizard.objective || "No objective provided"}
      />
    </dl>
  )
}

function ReviewItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-1 font-medium break-words">{value}</dd>
    </div>
  )
}
