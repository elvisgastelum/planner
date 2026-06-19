import { zodResolver } from "@hookform/resolvers/zod"
import { useSuspenseQuery } from "@tanstack/react-query"
import { useMutation } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { z } from "zod"

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
import { formatCents } from "@/features/plans/plan-ui.utils"

const editPeriodSchema = z.object({
  startsOn: z.string().min(1, "Start date is required"),
  endsOn: z.string().min(1, "End date is required"),
  fundingAmountCents: z.string().min(1, "Funding amount is required"),
  status: z.string(),
  periodType: z.string().min(1, "Period type is required"),
})

type EditPeriodForm = z.infer<typeof editPeriodSchema>

export const Route = createFileRoute(
  "/plans/$planId/payment-periods/$periodId/edit"
)({
  pendingComponent: () => <div>Loading...</div>,
  component: EditBudgetPeriodPage,
})

function EditBudgetPeriodPage() {
  const { periodId, planId } = Route.useParams()
  const navigate = useNavigate()

  const { data: periods } = useSuspenseQuery(planQueries.budgetPeriods(planId))
  const period = periods.find((p) => p.id === periodId)

  const { data: planData } = useSuspenseQuery(planQueries.detail(planId))

  const updateMutation = useMutation(planMutations.updateBudgetPeriod())
  const deleteMutation = useMutation(planMutations.deleteBudgetPeriod())

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<EditPeriodForm>({
    resolver: zodResolver(editPeriodSchema),
    values: period
      ? {
          startsOn: period.startsOn ?? "",
          endsOn: period.endsOn ?? "",
          fundingAmountCents: period.fundingAmountCents?.toString() ?? "",
          status: period.status ?? "open",
          periodType: period.periodType ?? "monthly",
        }
      : undefined,
  })

  const onSubmit = async (data: EditPeriodForm) => {
    try {
      await updateMutation.mutateAsync({
        planId,
        periodId,
        data: {
          startsOn: data.startsOn,
          endsOn: data.endsOn,
          fundingAmountCents: parseInt(data.fundingAmountCents),
          status: data.status as "open" | "closed" | "reconciled",
          periodType: data.periodType as
            | "opening"
            | "income"
            | "manual"
            | "monthly",
        },
      })

      await navigate({
        to: "/plans/$planId/payment-periods/$periodId",
        params: { planId, periodId },
      })
    } catch (error) {
      console.error("Failed to update period:", error)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ planId, periodId })
      await navigate({ to: "/plans/$planId", params: { planId } })
    } catch (error) {
      console.error("Failed to delete period:", error)
    }
  }

  if (!period) {
    return <div>Period not found</div>
  }

  const baseCurrency = planData.baseCurrency ?? "MXN"

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center gap-3">
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
          <CardTitle>Edit Budget Period</CardTitle>
          <CardDescription>Update budget period details.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">
                Current Funding Amount:
              </span>
              <span className="text-sm">
                {formatCents(period.fundingAmountCents, baseCurrency)}
              </span>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="startsOn">Start Date</Label>
              <DatePicker
                onChange={(value) => setValue("startsOn", value)}
                required
                value={watch("startsOn")}
              />
              {errors.startsOn && (
                <p className="text-sm text-destructive">
                  {errors.startsOn.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="endsOn">End Date</Label>
              <DatePicker
                onChange={(value) => setValue("endsOn", value)}
                required
                value={watch("endsOn")}
              />
              {errors.endsOn && (
                <p className="text-sm text-destructive">
                  {errors.endsOn.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="fundingAmountCents">
                Funding Amount (in cents)
              </Label>
              <Input type="number" {...register("fundingAmountCents")} />
              {errors.fundingAmountCents && (
                <p className="text-sm text-destructive">
                  {errors.fundingAmountCents.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="periodType">Period Type</Label>
              <Select
                value={watch("periodType")}
                onValueChange={(value) => setValue("periodType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="opening">Opening</SelectItem>
                  <SelectItem value="income">Income</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch("status")}
                onValueChange={(value) => setValue("status", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                  <SelectItem value="reconciled">Reconciled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2">
              <Button
                type="submit"
                disabled={isSubmitting || updateMutation.isPending}
              >
                {isSubmitting || updateMutation.isPending
                  ? "Saving..."
                  : "Save Changes"}
              </Button>

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Period
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Budget Period</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this budget period? This
                      action cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      className="text-destructive-foreground bg-destructive"
                    >
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>

            {updateMutation.isError && (
              <p className="text-sm text-destructive">
                Failed to update period. Please try again.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
