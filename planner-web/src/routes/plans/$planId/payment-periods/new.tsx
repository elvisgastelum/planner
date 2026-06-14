import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

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
  formatCurrency,
  toOptionalString,
} from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute("/plans/$planId/payment-periods/new")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(
        planQueries.paymentPeriods(params.planId)
      ),
      context.queryClient.ensureQueryData(
        planQueries.incomePaymentRefs(params.planId)
      ),
    ]),
  pendingComponent: ResourcePageSkeleton,
  component: NewPaymentPeriodPage,
})

function NewPaymentPeriodPage() {
  const navigate = useNavigate()
  const { planId } = Route.useParams()
  const { data: incomePayments } = useSuspenseQuery(
    planQueries.incomePaymentRefs(planId)
  )
  const createMutation = useMutation(planMutations.createPaymentPeriod())
  const [form, setForm] = useState({
    externalId: "",
    incomeDate: "",
    incomePaymentId: "none",
  })

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold">New payment period</h1>
          <p className="text-sm text-muted-foreground">
            Create a planning window and optionally link an income payment.
          </p>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link params={{ planId }} to="/plans/$planId/payment-periods">
            <ArrowLeft />
            Back to periods
          </Link>
        </Button>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Period details</CardTitle>
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
                    {payment.date} ·&nbsp;
                    {formatCurrency(payment.amount, payment.currency)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>
          <FormError error={createMutation.error} />
          <Button
            className="w-fit"
            disabled={createMutation.isPending || !form.incomeDate}
            onClick={() =>
              void (async () => {
                try {
                  await createMutation.mutateAsync({
                    planId,
                    data: {
                      externalId: toOptionalString(form.externalId),
                      incomeDate: form.incomeDate,
                      incomePaymentId:
                        form.incomePaymentId === "none"
                          ? undefined
                          : form.incomePaymentId,
                    },
                  })
                  toast.success("Payment period created.")
                  await navigate({
                    params: { planId },
                    to: "/plans/$planId/payment-periods",
                  })
                } catch (error) {
                  toast.error(
                    error instanceof Error
                      ? error.message
                      : "Failed to create payment period."
                  )
                }
              })()
            }
            type="button"
          >
            <Plus />
            Create period
          </Button>
        </CardContent>
      </Card>
    </main>
  )
}
