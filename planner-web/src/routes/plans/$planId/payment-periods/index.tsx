import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"

import type {
  IncomePaymentResponseDto,
  PaymentPeriodResponseDto,
} from "@/api/generated/model"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
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
import { EmptyState, FieldShell, FormError } from "@/features/plans/plan-ui"
import { TextField } from "@/features/plans/plan-ui"
import {
  formatCurrency,
  readText,
  toOptionalString,
} from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute("/plans/$planId/payment-periods/")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(planQueries.detail(params.planId)),
  component: PaymentPeriodsPage,
})

function PaymentPeriodsPage() {
  const { planId } = Route.useParams()
  const { data: plan } = useSuspenseQuery(planQueries.detail(planId))
  const createPeriodMutation = useMutation(planMutations.createPaymentPeriod())
  const updatePeriodMutation = useMutation(planMutations.updatePaymentPeriod())
  const deletePeriodMutation = useMutation(planMutations.deletePaymentPeriod())
  const [createForm, setCreateForm] = useState<{
    externalId: string
    incomeDate: string
    incomePaymentId: string
  }>({
    externalId: "",
    incomeDate: "",
    incomePaymentId: "none",
  })

  async function handleCreate() {
    if (!createForm.incomeDate) {
      return
    }

    await createPeriodMutation.mutateAsync({
      data: {
        externalId: toOptionalString(createForm.externalId),
        incomeDate: createForm.incomeDate,
        incomePaymentId:
          createForm.incomePaymentId === "none"
            ? undefined
            : createForm.incomePaymentId,
      },
      planId,
    })

    setCreateForm({ externalId: "", incomeDate: "", incomePaymentId: "none" })
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Payment periods</h1>
          <p className="text-sm text-muted-foreground">
            Create the planning windows that hold your expected spending items.
          </p>
        </div>
        <Link
          className="text-sm text-muted-foreground hover:text-foreground"
          params={{ planId }}
          to="/plans/$planId"
        >
          Back to plan
        </Link>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Create payment period</CardTitle>
          <CardDescription>
            Link a period to a specific income payment when available.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          <FieldShell label="External ID">
            <TextField
              onChange={(value) =>
                setCreateForm((current) => ({
                  ...current,
                  externalId: value,
                }))
              }
              value={createForm.externalId}
            />
          </FieldShell>
          <FieldShell label="Income date">
            <DatePicker
              onChange={(value) =>
                setCreateForm((current) => ({
                  ...current,
                  incomeDate: value,
                }))
              }
              required
              value={createForm.incomeDate}
            />
          </FieldShell>
          <FieldShell label="Income payment">
            <Select
              onValueChange={(value) =>
                setCreateForm((current) => ({
                  ...current,
                  incomePaymentId: value,
                }))
              }
              value={createForm.incomePaymentId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Optional linked payment" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No linked income payment</SelectItem>
                {plan.incomePayments.map((payment) => (
                  <SelectItem key={payment.id} value={payment.id}>
                    {payment.date} ·&nbsp;
                    {formatCurrency(payment.amount, payment.currency)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>
          <div className="flex flex-col gap-3 md:col-span-3">
            <FormError error={createPeriodMutation.error} />
            <Button
              className="w-fit"
              disabled={
                createPeriodMutation.isPending || !createForm.incomeDate
              }
              onClick={() => void handleCreate()}
              type="button"
            >
              {createPeriodMutation.isPending ? "Creating..." : "Create period"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {plan.paymentPeriods.length === 0 ? (
        <EmptyState
          description="Create a period first, then add planned items inside it."
          title="No payment periods yet"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plan.paymentPeriods.map((period) => (
            <PaymentPeriodCard
              deleteError={deletePeriodMutation.error}
              deletePendingId={deletePeriodMutation.variables?.periodId ?? null}
              incomePayments={plan.incomePayments}
              key={period.id}
              onDelete={() =>
                void deletePeriodMutation.mutateAsync({
                  periodId: period.id,
                  planId,
                })
              }
              onSave={(data) =>
                void updatePeriodMutation.mutateAsync({
                  data,
                  periodId: period.id,
                  planId,
                })
              }
              period={period}
              planId={planId}
              saveError={updatePeriodMutation.error}
              savePendingId={updatePeriodMutation.variables?.periodId ?? null}
            />
          ))}
        </div>
      )}
    </main>
  )
}

function PaymentPeriodCard({
  deleteError,
  deletePendingId,
  incomePayments,
  onDelete,
  onSave,
  period,
  planId,
  saveError,
  savePendingId,
}: {
  deleteError: Error | null
  deletePendingId: string | null
  incomePayments: Array<IncomePaymentResponseDto>
  onDelete: () => void
  onSave: (data: {
    externalId?: string
    incomeDate?: string
    incomePaymentId?: string
  }) => void
  period: PaymentPeriodResponseDto
  planId: string
  saveError: Error | null
  savePendingId: string | null
}) {
  const [form, setForm] = useState<{
    externalId: string
    incomeDate: string
    incomePaymentId: string
  }>({
    externalId: readText(period.externalId),
    incomeDate: readText(period.incomeDate),
    incomePaymentId: period.incomePayment?.id ?? "none",
  })
  const isSaving = savePendingId === period.id
  const isDeleting = deletePendingId === period.id
  const externalId = readText(period.externalId)

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>{period.incomeDate}</CardTitle>
            <CardDescription>{externalId || "No external ID"}</CardDescription>
          </div>
          <Link
            params={{ periodId: period.id, planId }}
            to="/plans/$planId/payment-periods/$periodId"
          >
            <Button type="button" variant="outline">
              Manage items
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="grid gap-3 rounded-xl border p-4 md:grid-cols-3">
          <SummaryMetric
            label="Planned total"
            value={formatCurrency(
              period.plannedTotal,
              period.incomePayment?.currency ?? "MXN"
            )}
          />
          <SummaryMetric
            label="Remaining planned"
            value={formatCurrency(
              period.plannedRemaining,
              period.incomePayment?.currency ?? "MXN"
            )}
          />
          <SummaryMetric label="Items" value={period.items.length.toString()} />
        </div>
        <FieldShell label="External ID">
          <TextField
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                externalId: value,
              }))
            }
            value={form.externalId}
          />
        </FieldShell>
        <FieldShell label="Income date">
          <DatePicker
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                incomeDate: value,
              }))
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
              <SelectItem value="none">No linked income payment</SelectItem>
              {incomePayments.map((payment) => (
                <SelectItem key={payment.id} value={payment.id}>
                  {payment.date} ·&nbsp;
                  {formatCurrency(payment.amount, payment.currency)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FieldShell>
        <FormError error={saveError ?? deleteError} />
        <div className="flex flex-wrap gap-2">
          <Button
            disabled={isSaving || !form.incomeDate}
            onClick={() =>
              onSave({
                externalId: toOptionalString(form.externalId),
                incomeDate: toOptionalString(form.incomeDate),
                incomePaymentId:
                  form.incomePaymentId === "none"
                    ? undefined
                    : form.incomePaymentId,
              })
            }
            type="button"
          >
            {isSaving ? "Saving..." : "Save"}
          </Button>
          <Button
            disabled={isDeleting}
            onClick={onDelete}
            type="button"
            variant="destructive"
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  )
}
