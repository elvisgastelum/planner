import { zodResolver } from "@hookform/resolvers/zod"
import { useSuspenseQuery } from "@tanstack/react-query"
import { useMutation } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { Archive, ArchiveRestore, ArrowLeft, Trash2 } from "lucide-react"
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

const editRecurringItemSchema = z.object({
  concept: z.string().min(1, "Concept is required"),
  amountCents: z.string().min(1, "Amount is required"),
  recurrenceRule: z.string().min(1, "Recurrence rule is required"),
  startsOn: z.string().optional(),
  endsOn: z.string().optional(),
  active: z.boolean(),
  itemType: z.string().min(1, "Item type is required"),
})

type EditRecurringItemForm = z.infer<typeof editRecurringItemSchema>

export const Route = createFileRoute(
  "/plans/$planId/recurring-expenses/$recurringExpenseId"
)({
  pendingComponent: () => <div>Loading...</div>,
  component: RecurringItemDetailPage,
})

function RecurringItemDetailPage() {
  const { recurringExpenseId, planId } = Route.useParams()
  const navigate = useNavigate()

  const { data: item } = useSuspenseQuery(
    planQueries.recurringItem(planId, recurringExpenseId)
  )
  const { data: planData } = useSuspenseQuery(planQueries.detail(planId))

  const updateMutation = useMutation(planMutations.updateRecurringItem())
  const archiveMutation = useMutation(planMutations.archiveRecurringItem())
  const restoreMutation = useMutation(planMutations.restoreRecurringItem())
  const deleteMutation = useMutation(planMutations.deleteRecurringItem())

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<EditRecurringItemForm>({
    resolver: zodResolver(editRecurringItemSchema),
    values: {
      concept: item.concept ?? "",
      amountCents: item.amountCents?.toString() ?? "",
      recurrenceRule: item.recurrenceRule ?? "",
      startsOn: item.startsOn ?? "",
      endsOn: item.endsOn ?? "",
      active: item.active ?? true,
      itemType: item.itemType ?? "expense",
    },
  })

  const onSubmit = async (data: EditRecurringItemForm) => {
    try {
      await updateMutation.mutateAsync({
        planId,
        recurringItemId: recurringExpenseId,
        data: {
          concept: data.concept,
          amountCents: parseInt(data.amountCents),
          recurrenceRule: data.recurrenceRule,
          startsOn: data.startsOn || undefined,
          endsOn: data.endsOn || undefined,
          active: data.active,
          itemType: data.itemType as
            | "expense"
            | "transfer"
            | "debt_payment"
            | "savings"
            | "other",
        },
      })
    } catch (error) {
      console.error("Failed to update recurring item:", error)
    }
  }

  const handleArchive = async () => {
    try {
      await archiveMutation.mutateAsync({
        planId,
        recurringItemId: recurringExpenseId,
      })
    } catch (error) {
      console.error("Failed to archive item:", error)
    }
  }

  const handleRestore = async () => {
    try {
      await restoreMutation.mutateAsync({
        planId,
        recurringItemId: recurringExpenseId,
      })
    } catch (error) {
      console.error("Failed to restore item:", error)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({
        planId,
        recurringItemId: recurringExpenseId,
      })
      await navigate({
        to: "/plans/$planId/recurring-expenses",
        params: { planId },
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
          <h1 className="text-2xl font-semibold">Recurring Item</h1>
          <p className="text-sm text-muted-foreground">
            Item ID: {recurringExpenseId}
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link params={{ planId }} to="/plans/$planId/recurring-expenses">
            <ArrowLeft />
            Back to recurring items
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Recurring Item Details</CardTitle>
          <CardDescription>
            View and edit recurring item information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Amount:</span>
              <span className="text-sm">
                {formatCents(item.amountCents, baseCurrency)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Status:</span>
              <span className="text-sm">
                {item.active ? "Active" : "Inactive"}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Type:</span>
              <span className="text-sm">{item.itemType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm font-medium">Starts On:</span>
              <span className="text-sm">{formatDateLabel(item.startsOn)}</span>
            </div>
            {item.endsOn && (
              <div className="flex justify-between">
                <span className="text-sm font-medium">Ends On:</span>
                <span className="text-sm">{formatDateLabel(item.endsOn)}</span>
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
              <Label htmlFor="amountCents">Amount (in cents)</Label>
              <Input type="number" {...register("amountCents")} />
              {errors.amountCents && (
                <p className="text-sm text-destructive">
                  {errors.amountCents.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="recurrenceRule">Recurrence Rule</Label>
              <Input
                placeholder="e.g. FREQ=MONTHLY;BYMONTHDAY=15"
                {...register("recurrenceRule")}
              />
              {errors.recurrenceRule && (
                <p className="text-sm text-destructive">
                  {errors.recurrenceRule.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="itemType">Item Type</Label>
              <Select
                value={watch("itemType")}
                onValueChange={(value) => setValue("itemType", value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="expense">Expense</SelectItem>
                  <SelectItem value="transfer">Transfer</SelectItem>
                  <SelectItem value="debt_payment">Debt Payment</SelectItem>
                  <SelectItem value="savings">Savings</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startsOn">Starts On (optional)</Label>
              <DatePicker
                onChange={(value) => setValue("startsOn", value)}
                value={watch("startsOn")}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="endsOn">Ends On (optional)</Label>
              <DatePicker
                onChange={(value) => setValue("endsOn", value)}
                value={watch("endsOn")}
              />
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

              {item.active ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleArchive}
                  disabled={archiveMutation.isPending}
                >
                  <Archive className="mr-2 h-4 w-4" />
                  Archive
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRestore}
                  disabled={restoreMutation.isPending}
                >
                  <ArchiveRestore className="mr-2 h-4 w-4" />
                  Restore
                </Button>
              )}

              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button type="button" variant="destructive" size="sm">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Recurring Item</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this recurring item? This
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
