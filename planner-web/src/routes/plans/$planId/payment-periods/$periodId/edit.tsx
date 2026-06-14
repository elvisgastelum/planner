import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Save, Trash2 } from "lucide-react"
import { useState } from "react"
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
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
  TextField,
} from "@/features/plans/plan-ui"
import { readText, toOptionalString } from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute(
  "/plans/$planId/payment-periods/$periodId/edit"
)({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        planQueries.paymentPeriod(params.periodId)
      ),
      context.queryClient.ensureQueryData(
        planQueries.incomePaymentRefs(params.planId)
      ),
    ]),
  pendingComponent: ResourcePageSkeleton,
  component: EditPaymentPeriodPage,
})

function EditPaymentPeriodPage() {
  const navigate = useNavigate()
  const { periodId, planId } = Route.useParams()
  const { data: period } = useSuspenseQuery(planQueries.paymentPeriod(periodId))
  const { data: incomePayments } = useSuspenseQuery(
    planQueries.incomePaymentRefs(planId)
  )
  const updateMutation = useMutation(planMutations.updatePaymentPeriod())
  const deleteMutation = useMutation(planMutations.deletePaymentPeriod())
  const [form, setForm] = useState({
    externalId: readText(period.externalId),
    incomeDate: period.incomeDate,
    incomePaymentId: period.incomePayment?.id ?? "none",
  })

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">Edit payment period</h1>
          <p className="text-sm text-muted-foreground">
            Update the period metadata or remove it.
          </p>
        </div>
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
          <CardTitle>{period.incomeDate}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <FieldShell label="External ID">
            <TextField
              onChange={(value) =>
                setForm((current) => ({ ...current, externalId: value }))
              }
              value={form.externalId}
            />
          </FieldShell>
          <FieldShell label="Income date">
            <DatePicker
              onChange={(value) =>
                setForm((current) => ({ ...current, incomeDate: value }))
              }
              required
              value={form.incomeDate}
            />
          </FieldShell>
          <FieldShell label="Income payment">
            <Select
              onValueChange={(value) =>
                setForm((current) => ({ ...current, incomePaymentId: value }))
              }
              value={form.incomePaymentId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Optional linked payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No linked payment</SelectItem>
                {incomePayments.map((payment) => (
                  <SelectItem key={payment.id} value={payment.id}>
                    {payment.date} · {payment.amount}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>
          <FormError error={updateMutation.error ?? deleteMutation.error} />
          <div className="flex flex-wrap gap-2 md:col-span-3">
            <Button
              disabled={updateMutation.isPending || !form.incomeDate}
              onClick={() =>
                void (async () => {
                  try {
                    await updateMutation.mutateAsync({
                      data: {
                        externalId: toOptionalString(form.externalId),
                        incomeDate: form.incomeDate,
                        incomePaymentId:
                          form.incomePaymentId === "none"
                            ? undefined
                            : form.incomePaymentId,
                      },
                      periodId,
                      planId,
                    })
                    toast.success("Payment period updated.")
                    await navigate({
                      params: { planId },
                      to: "/plans/$planId/payment-periods",
                    })
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Failed to update payment period."
                    )
                  }
                })()
              }
              type="button"
            >
              <Save />
              Save changes
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  disabled={deleteMutation.isPending}
                  type="button"
                  variant="destructive"
                >
                  <Trash2 />
                  Delete period
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete payment period?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This will remove the period and its planned items.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deleteMutation.isPending}
                    onClick={() =>
                      void (async () => {
                        try {
                          await deleteMutation.mutateAsync({ periodId, planId })
                          toast.success("Payment period deleted.")
                          await navigate({
                            params: { planId },
                            to: "/plans/$planId/payment-periods",
                          })
                        } catch (error) {
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : "Failed to delete payment period."
                          )
                        }
                      })()
                    }
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
