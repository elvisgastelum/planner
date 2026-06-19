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

const editPaymentSchema = z.object({
  paidOn: z.string().min(1, "Payment date is required"),
  status: z.string(),
  paymentNumberInMonth: z.string().optional(),
})

type EditPaymentForm = z.infer<typeof editPaymentSchema>

export const Route = createFileRoute(
  "/plans/$planId/income/payments/$incomePaymentId"
)({
  pendingComponent: () => <div>Loading...</div>,
  component: EditIncomePaymentPage,
})

function EditIncomePaymentPage() {
  const { incomePaymentId, planId } = Route.useParams()
  const navigate = useNavigate()

  const { data: payment } = useSuspenseQuery(
    planQueries.incomePayment(planId, incomePaymentId)
  )

  const updateMutation = useMutation(planMutations.updateIncomePayment())
  const deleteMutation = useMutation(planMutations.deleteIncomePayment())

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
  } = useForm<EditPaymentForm>({
    resolver: zodResolver(editPaymentSchema),
    values: {
      paidOn: payment.paidOn ?? "",
      status: payment.status ?? "received",
      paymentNumberInMonth: payment.paymentNumberInMonth?.toString() ?? "",
    },
  })

  const onSubmit = async (data: EditPaymentForm) => {
    try {
      await updateMutation.mutateAsync({
        planId,
        incomePaymentId,
        data: {
          paidOn: data.paidOn,
          status: data.status as "received" | "projected" | "cancelled",
          paymentNumberInMonth: data.paymentNumberInMonth
            ? parseInt(data.paymentNumberInMonth)
            : undefined,
        },
      })
    } catch (error) {
      console.error("Failed to update payment:", error)
    }
  }

  const handleDelete = async () => {
    try {
      await deleteMutation.mutateAsync({ planId, incomePaymentId })
      await navigate({
        to: "/plans/$planId/income/payments",
        params: { planId },
      })
    } catch (error) {
      console.error("Failed to delete payment:", error)
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Income Payment</h1>
          <p className="text-sm text-muted-foreground">
            Payment ID: {incomePaymentId}
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link params={{ planId }} to="/plans/$planId/income/payments">
            <ArrowLeft />
            Back to payments
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Payment Details</CardTitle>
          <CardDescription>
            View and edit income payment information.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm font-medium">Income Source ID:</span>
              <span className="text-sm">{payment.incomeSourceId}</span>
            </div>
            {payment.incomeScheduleId && (
              <div className="flex justify-between">
                <span className="text-sm font-medium">Schedule ID:</span>
                <span className="text-sm">{payment.incomeScheduleId}</span>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="paidOn">Payment Date</Label>
              <DatePicker
                onChange={(value) => setValue("paidOn", value)}
                required
                value={watch("paidOn")}
              />
              {errors.paidOn && (
                <p className="text-sm text-destructive">
                  {errors.paidOn.message}
                </p>
              )}
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
                  <SelectItem value="received">Received</SelectItem>
                  <SelectItem value="projected">Projected</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentNumberInMonth">
                Payment Number in Month (optional)
              </Label>
              <Input type="number" {...register("paymentNumberInMonth")} />
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
                    <AlertDialogTitle>Delete Payment</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this payment? This action
                      cannot be undone.
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
                Failed to update payment. Please try again.
              </p>
            )}
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
