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
import { formatCents, formatDateLabel } from "@/features/plans/plan-ui.utils"

const editItemSchema = z.object({
  concept: z.string().min(1, "Concept is required"),
  plannedAmountCents: z.string().min(1, "Amount is required"),
  dueOn: z.string().optional(),
  status: z.string(),
  rolloverPolicy: z.string().optional(),
  notes: z.string().optional(),
})

type EditItemForm = z.infer<typeof editItemSchema>

export const Route = createFileRoute(
  "/plans/$planId/payment-periods/$periodId/items/$itemId/"
)({
  pendingComponent: () => <div>Loading...</div>,
  component: BudgetItemDetailPage,
})

function BudgetItemDetailPage() {
  const { itemId, periodId, planId } = Route.useParams()
  const navigate = useNavigate()

  const { data: item } = useSuspenseQuery(
    planQueries.budgetItem(planId, periodId, itemId)
  )
  const { data: planData } = useSuspenseQuery(planQueries.detail(planId))

  const updateMutation = useMutation(planMutations.updateBudgetItem())
  const deleteMutation = useMutation(planMutations.deleteBudgetItem())

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<EditItemForm>({
    resolver: zodResolver(editItemSchema),
    values: {
      concept: item.concept ?? "",
      plannedAmountCents: item.plannedAmountCents?.toString() ?? "",
      dueOn: item.dueOn ?? "",
      status: item.status ?? "planned",
      rolloverPolicy: item.rolloverPolicy ?? "rollover",
      notes: item.notes ?? "",
    },
  })

  const onSubmit = async (data: EditItemForm) => {
    try {
      await updateMutation.mutateAsync({
        planId,
        periodId,
        itemId,
        data: {
          concept: data.concept,
          plannedAmountCents: parseInt(data.plannedAmountCents),
          dueOn: data.dueOn || undefined,
          status: data.status as
            | "planned"
            | "active"
            | "completed"
            | "cancelled",
          rolloverPolicy:
            (data.rolloverPolicy as "rollover" | "expire" | "treat_as_spent") ||
            undefined,
          notes: data.notes || undefined,
        },
      })
    } catch (error) {
      console.error("Failed to update item:", error)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ planId, periodId, itemId })
      await navigate({
        to: "/plans/$planId/payment-periods/$periodId",
        params: { planId, periodId },
      })
    } catch (error) {
      console.error("Failed to delete item:", error)
    }
  }

  const baseCurrency = planData.baseCurrency ?? "MXN"

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Budget Item</h1>
          <p className="text-sm text-muted-foreground">Item ID: {itemId}</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="ghost" size="sm">
            <Link
              params={{ periodId, planId }}
              to="/plans/$planId/payment-periods/$periodId"
            >
              <ArrowLeft />
              Back to period
            </Link>
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Budget Item Details</CardTitle>
          <CardDescription>
            View and edit budget item information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Planned Amount:</span>
              <span className="text-sm">
                {formatCents(item.plannedAmountCents, baseCurrency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Status:</span>
              <span className="text-sm">{item.status}</span>
            </div>
            {item.dueOn && (
              <div className="flex justify-between">
                <span className="text-sm font-medium">Due On:</span>
                <span className="text-sm">{formatDateLabel(item.dueOn)}</span>
              </div>
            )}
            {item.rolloverPolicy && (
              <div className="flex justify-between">
                <span className="text-sm font-medium">Rollover Policy:</span>
                <span className="text-sm">{item.rolloverPolicy}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="concept">Concept</Label>
              <Input {...register("concept")} />
              {errors.concept && (
                <p className="text-sm text-destructive">
                  {errors.concept.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="plannedAmountCents">
                Planned Amount (in cents)
              </Label>
              <Input type="number" {...register("plannedAmountCents")} />
              {errors.plannedAmountCents && (
                <p className="text-sm text-destructive">
                  {errors.plannedAmountCents.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="dueOn">Due Date (optional)</Label>
              <DatePicker
                onChange={(value) => setValue("dueOn", value)}
                required
                value={watch("dueOn")}
              />
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
                  <SelectItem value="planned">Planned</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="rolloverPolicy">Rollover Policy (optional)</Label>
              <Select
                value={watch("rolloverPolicy")}
                onValueChange={(value) => setValue("rolloverPolicy", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rollover">Rollover</SelectItem>
                  <SelectItem value="expire">Expire</SelectItem>
                  <SelectItem value="treat_as_spent">Treat as Spent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (optional)</Label>
              <Input {...register("notes")} />
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
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Budget Item</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this budget item? This
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
                Failed to update item. Please try again.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
