import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Plus } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import {
  CreateIncomePaymentDtoSource,
  CreateIncomePaymentDtoStatus,
} from "@/api/generated/model"
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
  toOptionalPositiveInteger,
  toOptionalPositiveNumber,
  toOptionalString,
} from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute("/plans/$planId/income/payments/new")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(planQueries.detail(params.planId)),
  pendingComponent: ResourcePageSkeleton,
  component: NewIncomePaymentPage,
})

const paymentStatuses = Object.values(CreateIncomePaymentDtoStatus)
const paymentSources = Object.values(CreateIncomePaymentDtoSource)

function NewIncomePaymentPage() {
  const navigate = useNavigate()
  const { planId } = Route.useParams()
  const { data: plan } = useSuspenseQuery(planQueries.detail(planId))
  const createMutation = useMutation(planMutations.createIncomePayment())
  const [form, setForm] = useState({
    amount: "",
    currency: plan.currency,
    date: "",
    externalId: "",
    paymentNumberInMonth: "1",
    source: CreateIncomePaymentDtoSource.manual,
    status: CreateIncomePaymentDtoStatus.projected,
  })

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">New income payment</h1>
          <p className="text-sm text-muted-foreground">
            Create a manual correction or one-off payment.
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
          <CardTitle>Payment details</CardTitle>
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
          <FormError error={createMutation.error} />
          <div className="flex gap-2 md:col-span-2">
            <Button
              disabled={
                createMutation.isPending ||
                !form.date ||
                !form.amount.trim() ||
                toOptionalPositiveNumber(form.amount) === undefined ||
                toOptionalPositiveInteger(form.paymentNumberInMonth) ===
                  undefined
              }
              onClick={() =>
                void (async () => {
                  try {
                    await createMutation.mutateAsync({
                      planId,
                      data: {
                        amount: toOptionalPositiveNumber(form.amount)!,
                        currency: toOptionalString(form.currency),
                        date: form.date,
                        externalId: toOptionalString(form.externalId),
                        paymentNumberInMonth: toOptionalPositiveInteger(
                          form.paymentNumberInMonth
                        )!,
                        source: form.source,
                        status: form.status,
                      },
                    })
                    toast.success("Income payment created.")
                    await navigate({
                      params: { planId },
                      to: "/plans/$planId/income",
                    })
                  } catch (error) {
                    toast.error(
                      error instanceof Error
                        ? error.message
                        : "Failed to create income payment."
                    )
                  }
                })()
              }
              type="button"
            >
              <Plus />
              Create payment
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
