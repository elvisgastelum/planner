import { useMutation } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft } from "lucide-react"
import { parseAsInteger, parseAsString, useQueryStates } from "nuqs"
import type { FormEvent } from "react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { planMutations } from "@/features/plans/data-access/plan.mutations"
import { cn } from "@/lib/utils"

const importWizardParsers = {
  importPath: parseAsString.withDefault(""),
  step: parseAsInteger.withDefault(1),
}

export const Route = createFileRoute("/plans/import")({
  component: ImportPlanPage,
})

function ImportPlanPage() {
  const navigate = useNavigate()
  const importJsonMutation = useMutation(planMutations.importJson())
  const [wizard, setWizard] = useQueryStates(importWizardParsers, {
    history: "replace",
  })

  async function handleImportJson(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const result = await importJsonMutation.mutateAsync({
      path: wizard.importPath || undefined,
    })

    await setWizard(null)
    await navigate({ params: { planId: result.id }, to: "/plans/$planId" })
  }

  const step = Math.min(Math.max(wizard.step, 1), 2)
  const canGoBack = step > 1

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

      <form onSubmit={handleImportJson}>
        <Card>
          <CardHeader>
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <h2 className="text-lg font-semibold">Import JSON</h2>
                <p className="text-sm text-muted-foreground">
                  The current planner-api imports JSON from a backend-readable
                  path. Leave the path blank to use the API default.
                </p>
              </div>
              <ol className="flex flex-wrap gap-2 text-xs">
                {["Source", "Review"].map((label, index) => {
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
              <div>
                <FieldShell label="Backend JSON path">
                  <Input
                    onChange={(event) =>
                      void setWizard({
                        importPath: event.currentTarget.value,
                      })
                    }
                    placeholder="src/plan-financiero.json"
                    value={wizard.importPath}
                  />
                </FieldShell>
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

            <div className="mt-6 flex flex-col gap-3">
              {importJsonMutation.error ? (
                <p className="text-sm text-destructive">
                  {importJsonMutation.error.message}
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
                    disabled={!canGoBack || importJsonMutation.isPending}
                    onClick={() => void setWizard({ step: step - 1 })}
                    type="button"
                    variant="outline"
                  >
                    Back
                  </Button>
                  {step === 2 ? (
                    <Button
                      disabled={importJsonMutation.isPending}
                      type="submit"
                    >
                      {importJsonMutation.isPending
                        ? "Working..."
                        : "Import plan"}
                    </Button>
                  ) : (
                    <Button
                      disabled={importJsonMutation.isPending}
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
