import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Save, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import {
  CreateIncomePaymentDtoSource,
  CreateIncomePaymentDtoStatus,
  type UpdateIncomePaymentDto,
} from "@/api/generated/model"
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
import {
  readText,
  toOptionalPositiveInteger,
  toOptionalPositiveNumber,
  toOptionalString,
} from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute(
  "/plans/$planId/income/payments/$incomePaymentId"
)({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(planQueries.detail(params.planId)),
      context.queryClient.ensureQueryData(
        planQueries.incomePayment(params.planId, params.incomePaymentId)
      ),
    ]),
  pendingComponent: ResourcePageSkeleton,
  component: EditIncomePaymentPage,
})

const paymentStatuses = Object.values(CreateIncomePaymentDtoStatus)
const paymentSources = Object.values(CreateIncomePaymentDtoSource)

function EditIncomePaymentPage() {
  const navigate = useNavigate()
  const { incomePaymentId, planId } = Route.useParams()
  const { data: plan } = useSuspenseQuery(planQueries.detail(planId))
  const { data: payment } = useSuspenseQuery(
    planQueries.incomePayment(planId, incomePaymentId)
  )
  const updateMutation = useMutation(planMutations.updateIncomePayment())
  const deleteMutation = useMutation(planMutations.deleteIncomePayment())
  const [form, setForm] = useState({
    amount: payment.amount.toString(),
    currency: readText(payment.currency) || plan.currency,
    date: payment.date,
    externalId: readText(payment.externalId),
    paymentNumberInMonth: payment.paymentNumberInMonth.toString(),
    source: payment.source,
    status: payment.status,
  })

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Edit income payment</h1>
          <p className="text-sm text-muted-foreground">
            Update or remove this payment.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link params={{ planId }} to="/plans/$planId/income">
            <ArrowLeft />
            Back to income
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{payment.date}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FieldShell label="External ID">
            <TextField
              onChange={(value) =>
                setForm((current) => ({ ...current, externalId: value }))
              }
              value={form.externalId}
            />
          </FieldShell>
          <FieldShell label="Date">
            <DatePicker
              onChange={(value) =>
                setForm((current) => ({ ...current, date: value }))
              }
              required
              value={form.date}
            />
          </FieldShell>
          <FieldShell label="Payment number">
            <TextField
              min="1"
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  paymentNumberInMonth: value,
                }))
              }
              type="number"
              value={form.paymentNumberInMonth}
            />
          </FieldShell>
          <FieldShell label="Amount">
            <TextField
              min="0"
              onChange={(value) =>
                setForm((current) => ({ ...current, amount: value }))
              }
              step="0.01"
              type="number"
              value={form.amount}
            />
          </FieldShell>
          <FieldShell label="Currency">
            <TextField
              onChange={(value) =>
                setForm((current) => ({ ...current, currency: value }))
              }
              value={form.currency}
            />
          </FieldShell>
          <FieldShell label="Status">
            <Select
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  status: value as typeof form.status,
                }))
              }
              value={form.status}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {paymentStatuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>
          <FieldShell label="Source">
            <Select
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  source: value as typeof form.source,
                }))
              }
              value={form.source}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                {paymentSources.map((source) => (
                  <SelectItem key={source} value={source}>
                    {source}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>
          <FormError error={updateMutation.error ?? deleteMutation.error} />
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button
              disabled={
                updateMutation.isPending ||
                !form.date ||
                !form.amount.trim() ||
                toOptionalPositiveNumber(form.amount) === undefined ||
                toOptionalPositiveInteger(form.paymentNumberInMonth) ===
                  undefined
              }
              onClick={() =>
                void (async () => {
                  try {
                    await updateMutation.mutateAsync({
                      incomePaymentId,
                      planId,
                      data: {
                        amount: toOptionalPositiveNumber(form.amount),
                        currency: toOptionalString(form.currency),
                        date: toOptionalString(form.date),
                        externalId: toOptionalString(form.externalId),
                        paymentNumberInMonth: toOptionalPositiveInteger(
                          form.paymentNumberInMonth
                        ),
                        source: form.source as UpdateIncomePaymentDto["source"],
                        status: form.status as UpdateIncomePaymentDto["status"],
                      } satisfies UpdateIncomePaymentDto,
                    })
                    toast.success("Income payment updated.")
                    await navigate({
                      params: { planId },
                      to: "/plans/$planId/income",
                    })
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Failed to update income payment."
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
                  Delete payment
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete income payment?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={deleteMutation.isPending}
                    onClick={() =>
                      void (async () => {
                        try {
                          await deleteMutation.mutateAsync({
                            incomePaymentId,
                            planId,
                          })
                          toast.success("Income payment deleted.")
                          await navigate({
                            params: { planId },
                            to: "/plans/$planId/income",
                          })
                        } catch (error) {
                          toast.error(
                            error instanceof Error
                              ? error.message
                              : "Failed to delete income payment."
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
