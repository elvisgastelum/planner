import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
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
import { planMutations } from "@/features/plans/data-access/plan.mutations"
import { planQueries } from "@/features/plans/data-access/plan.queries"
import { StatusActionMenu } from "@/features/plans/plan-actions"
import { PlansPageSkeleton } from "@/features/plans/plan-ui"

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
  const updatePlanMutation = useMutation(planMutations.update())

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

  function openPlan(planId: string) {
    navigate({ to: "/plans/$planId", params: { planId } })
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Financial plans</h1>
          <p className="text-sm text-muted-foreground">
            Select a plan or create a new plan to get started.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild size="sm">
            <Link to="/plans/new">Create plan</Link>
          </Button>
        </div>
      </div>

      {plans.length === 0 ? (
        <Card>
          <CardContent className="text-sm text-muted-foreground">
            No plans found. Create a plan to get started.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plans.map((plan) => (
            <Card
              aria-label={`Open plan ${plan.name}`}
              className="h-full cursor-pointer transition-colors hover:bg-accent/10 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:outline-none"
              key={plan.id}
              onClick={() => openPlan(plan.id)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault()
                  openPlan(plan.id)
                }
              }}
              role="button"
              tabIndex={0}
            >
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <CardTitle className="leading-tight">{plan.name}</CardTitle>
                    <CardDescription>
                      {plan.currency} · starts {plan.startDate}
                    </CardDescription>
                  </div>
                  <div
                    className="flex items-center gap-2"
                    onClick={(event) => event.stopPropagation()}
                  >
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
            </Card>
          ))}
        </div>
      )}
    </main>
  )
}
