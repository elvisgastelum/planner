import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
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
import { FormError, ResourcePageSkeleton } from "@/features/plans/plan-ui"

export const Route = createFileRoute("/plans/$planId/danger")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(planQueries.detail(params.planId)),
  component: DangerZonePage,
  pendingComponent: ResourcePageSkeleton,
})

function DangerZonePage() {
  const navigate = useNavigate()
  const { planId } = Route.useParams()
  const { data: plan } = useSuspenseQuery(planQueries.detail(planId))
  const deletePlanMutation = useMutation(planMutations.delete())

  async function handleDelete() {
    try {
      await deletePlanMutation.mutateAsync(planId)
      toast.success("Plan deleted.")
      await navigate({ to: "/plans" })
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Failed to delete plan."
      )
    }
  }

  return (
    <div className="mx-auto w-full max-w-4xl p-6">
      <header className="mb-6 flex items-center gap-3">
        <Button asChild variant="ghost" size="sm">
          <Link params={{ planId }} to="/plans/$planId">
            <ArrowLeft />
            Back to overview
          </Link>
        </Button>
      </header>

      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="text-destructive">Danger Zone</CardTitle>
          <CardDescription>Irreversible actions for this plan.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-medium">Delete &ldquo;{plan.name}&rdquo;</h3>
            <p className="text-sm text-muted-foreground">
              Permanently delete this plan and all of its data. This action
              cannot be undone.
            </p>
          </div>
          <FormError error={deletePlanMutation.error} />
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                disabled={deletePlanMutation.isPending}
                type="button"
                variant="destructive"
              >
                <Trash2 />
                Delete plan
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete financial plan?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will permanently remove the plan and all related data.
                  This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  disabled={deletePlanMutation.isPending}
                  onClick={() => void handleDelete()}
                >
                  {deletePlanMutation.isPending ? "Deleting..." : "Delete"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardContent>
      </Card>
    </div>
  )
}
