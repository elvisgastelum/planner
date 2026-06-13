import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link } from "@tanstack/react-router"
import { useState } from "react"

import type { FinancialPlanDetailResponseDto } from "@/api/generated/model"
import {
  CreateIncomePaymentDtoSource,
  CreateIncomePaymentDtoStatus,
  CreateIncomeScheduleDtoCadence,
  type IncomePaymentResponseDto,
  type UpdateIncomePaymentDto,
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
import {
  EmptyState,
  FieldShell,
  FormError,
  StatusBadge,
  TextField,
} from "@/features/plans/plan-ui"
import {
  formatCurrency,
  readText,
  toOptionalPositiveInteger,
  toOptionalPositiveNumber,
  toOptionalString,
} from "@/features/plans/plan-ui.utils"

export const Route = createFileRoute("/plans/$planId/income")({
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(planQueries.detail(params.planId)),
  component: IncomePage,
})

const scheduleCadences = Object.values(CreateIncomeScheduleDtoCadence)
const paymentStatuses = Object.values(CreateIncomePaymentDtoStatus)
const paymentSources = Object.values(CreateIncomePaymentDtoSource)
type PaymentStatus =
  (typeof CreateIncomePaymentDtoStatus)[keyof typeof CreateIncomePaymentDtoStatus]
type PaymentSource =
  (typeof CreateIncomePaymentDtoSource)[keyof typeof CreateIncomePaymentDtoSource]
type ScheduleCadence =
  (typeof CreateIncomeScheduleDtoCadence)[keyof typeof CreateIncomeScheduleDtoCadence]

type AmountRuleForm = {
  paymentNumberInMonth: string
  amount: string
  currency: string
}

type ScheduleForm = {
  cadence: ScheduleCadence
  anchorPaymentDate: string
  currency: string
  ordinaryMonthGrossIncome: string
  ordinaryMonthNetReference: string
  calculationRule: string
  amountRules: AmountRuleForm[]
}

type PaymentForm = {
  amount: string
  currency: string
  date: string
  externalId: string
  paymentNumberInMonth: string
  source: PaymentSource
  status: PaymentStatus
}

const getScheduleForm = (
  plan: FinancialPlanDetailResponseDto | null | undefined
) => {
  if (!plan) {
    return {
      cadence: CreateIncomeScheduleDtoCadence.every_14_days,
      anchorPaymentDate: "",
      currency: "MXN",
      ordinaryMonthGrossIncome: "",
      ordinaryMonthNetReference: "",
      calculationRule: "",
      amountRules: [{ paymentNumberInMonth: "1", amount: "", currency: "" }],
    }
  }

  const schedule = plan.incomeSchedule

  if (!schedule) {
    return {
      cadence: CreateIncomeScheduleDtoCadence.every_14_days,
      anchorPaymentDate: plan.startDate,
      currency: plan.currency,
      ordinaryMonthGrossIncome: "",
      ordinaryMonthNetReference: "",
      calculationRule: "",
      amountRules: [
        {
          paymentNumberInMonth: "1",
          amount: "",
          currency: plan.currency,
        },
      ],
    }
  }

  return {
    cadence: schedule.cadence,
    anchorPaymentDate: readText(schedule.anchorPaymentDate),
    currency: readText(schedule.currency),
    ordinaryMonthGrossIncome:
      schedule.ordinaryMonthGrossIncome?.toString() ?? "",
    ordinaryMonthNetReference:
      schedule.ordinaryMonthNetReference?.toString() ?? "",
    calculationRule: readText(schedule.calculationRule),
    amountRules:
      schedule.amountRules.length > 0
        ? schedule.amountRules.map((rule) => ({
            paymentNumberInMonth: rule.paymentNumberInMonth.toString(),
            amount: rule.amount.toString(),
            currency: readText(rule.currency) || readText(schedule.currency),
          }))
        : [
            {
              paymentNumberInMonth: "1",
              amount: "",
              currency: readText(schedule.currency),
            },
          ],
  }
}

function IncomePage() {
  const { planId } = Route.useParams()
  const { data: plan } = useSuspenseQuery(planQueries.detail(planId))
  const createScheduleMutation = useMutation(
    planMutations.createIncomeSchedule()
  )
  const updateScheduleMutation = useMutation(
    planMutations.updateIncomeSchedule()
  )
  const deleteScheduleMutation = useMutation(
    planMutations.deleteIncomeSchedule()
  )
  const generatePaymentsMutation = useMutation(
    planMutations.generateIncomePayments()
  )
  const createPaymentMutation = useMutation(planMutations.createIncomePayment())
  const updatePaymentMutation = useMutation(planMutations.updateIncomePayment())
  const deletePaymentMutation = useMutation(planMutations.deleteIncomePayment())
  const [scheduleForm, setScheduleForm] = useState<ScheduleForm>(
    getScheduleForm(plan)
  )
  const [generateThrough, setGenerateThrough] = useState("")
  const [createPaymentForm, setCreatePaymentForm] = useState<PaymentForm>({
    amount: "",
    currency: plan.currency,
    date: "",
    externalId: "",
    paymentNumberInMonth: "1",
    source: CreateIncomePaymentDtoSource.manual,
    status: CreateIncomePaymentDtoStatus.projected,
  })
  const schedule = plan.incomeSchedule

  async function handleSaveSchedule() {
    const hasIncompleteAmountRules = scheduleForm.amountRules.some(
      (rule) =>
        Boolean(rule.amount.trim()) !==
        Boolean(rule.paymentNumberInMonth.trim())
    )

    if (
      (scheduleForm.ordinaryMonthGrossIncome.trim() &&
        toOptionalPositiveNumber(scheduleForm.ordinaryMonthGrossIncome) ===
          undefined) ||
      (scheduleForm.ordinaryMonthNetReference.trim() &&
        toOptionalPositiveNumber(scheduleForm.ordinaryMonthNetReference) ===
          undefined) ||
      scheduleForm.amountRules.some(
        (rule) =>
          (rule.amount.trim() || rule.paymentNumberInMonth.trim()) &&
          (toOptionalPositiveNumber(rule.amount) === undefined ||
            toOptionalPositiveInteger(rule.paymentNumberInMonth) === undefined)
      ) ||
      hasIncompleteAmountRules
    ) {
      return
    }

    const payload = {
      amountRules: scheduleForm.amountRules
        .map((rule) => {
          const amount = toOptionalPositiveNumber(rule.amount)
          const paymentNumberInMonth = toOptionalPositiveInteger(
            rule.paymentNumberInMonth
          )

          if (amount === undefined || paymentNumberInMonth === undefined) {
            return null
          }

          return {
            amount,
            currency: toOptionalString(rule.currency),
            paymentNumberInMonth,
          }
        })
        .filter(
          (
            rule
          ): rule is {
            amount: number
            currency: string | undefined
            paymentNumberInMonth: number
          } => rule !== null
        ),
      anchorPaymentDate: scheduleForm.anchorPaymentDate,
      cadence: scheduleForm.cadence,
      calculationRule: toOptionalString(scheduleForm.calculationRule),
      currency: toOptionalString(scheduleForm.currency),
      ordinaryMonthGrossIncome: toOptionalPositiveNumber(
        scheduleForm.ordinaryMonthGrossIncome
      ),
      ordinaryMonthNetReference: toOptionalPositiveNumber(
        scheduleForm.ordinaryMonthNetReference
      ),
    }

    if (schedule) {
      await updateScheduleMutation.mutateAsync({ data: payload, planId })
      return
    }

    await createScheduleMutation.mutateAsync({ data: payload, planId })
  }

  async function handleCreatePayment() {
    const amount = toOptionalPositiveNumber(createPaymentForm.amount)
    const paymentNumberInMonth = toOptionalPositiveInteger(
      createPaymentForm.paymentNumberInMonth
    )

    if (amount === undefined || paymentNumberInMonth === undefined) {
      return
    }

    await createPaymentMutation.mutateAsync({
      data: {
        amount,
        currency: toOptionalString(createPaymentForm.currency),
        date: createPaymentForm.date,
        externalId: toOptionalString(createPaymentForm.externalId),
        paymentNumberInMonth,
        source: createPaymentForm.source,
        status: createPaymentForm.status,
      },
      planId,
    })

    setCreatePaymentForm({
      amount: "",
      currency: plan.currency,
      date: "",
      externalId: "",
      paymentNumberInMonth: "1",
      source: CreateIncomePaymentDtoSource.manual,
      status: CreateIncomePaymentDtoStatus.projected,
    })
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Income</h1>
          <p className="text-sm text-muted-foreground">
            Configure an income schedule and the concrete payments used by the
            plan.
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
          <CardTitle>
            {schedule ? "Update income schedule" : "Create income schedule"}
          </CardTitle>
          <CardDescription>
            The API currently exposes cadence as a typed enum.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FieldShell label="Cadence">
            <Select
              onValueChange={(value) =>
                setScheduleForm((current) => ({
                  ...current,
                  cadence: value as ScheduleCadence,
                }))
              }
              value={scheduleForm.cadence}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select cadence" />
              </SelectTrigger>
              <SelectContent>
                {scheduleCadences.map((cadence) => (
                  <SelectItem key={cadence} value={cadence}>
                    {cadence}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FieldShell>
          <FieldShell label="Anchor payment date">
            <DatePicker
              onChange={(value) =>
                setScheduleForm((current) => ({
                  ...current,
                  anchorPaymentDate: value,
                }))
              }
              required
              value={scheduleForm.anchorPaymentDate}
            />
          </FieldShell>
          <FieldShell label="Currency">
            <TextField
              onChange={(value) =>
                setScheduleForm((current) => ({
                  ...current,
                  currency: value,
                }))
              }
              value={scheduleForm.currency}
            />
          </FieldShell>
          <FieldShell label="Ordinary month gross income">
            <TextField
              min="0"
              onChange={(value) =>
                setScheduleForm((current) => ({
                  ...current,
                  ordinaryMonthGrossIncome: value,
                }))
              }
              step="0.01"
              type="number"
              value={scheduleForm.ordinaryMonthGrossIncome}
            />
          </FieldShell>
          <FieldShell label="Ordinary month net reference">
            <TextField
              min="0"
              onChange={(value) =>
                setScheduleForm((current) => ({
                  ...current,
                  ordinaryMonthNetReference: value,
                }))
              }
              step="0.01"
              type="number"
              value={scheduleForm.ordinaryMonthNetReference}
            />
          </FieldShell>
          <FieldShell label="Calculation rule">
            <TextField
              onChange={(value) =>
                setScheduleForm((current) => ({
                  ...current,
                  calculationRule: value,
                }))
              }
              placeholder="Optional backend rule name"
              value={scheduleForm.calculationRule}
            />
          </FieldShell>
          <div className="grid gap-3 rounded-xl border p-4 md:col-span-2">
            <div className="flex items-center justify-between gap-2">
              <div>
                <h3 className="font-medium">Amount rules</h3>
                <p className="text-sm text-muted-foreground">
                  One row per payment position inside the month.
                </p>
              </div>
              <Button
                onClick={() =>
                  setScheduleForm((current) => ({
                    ...current,
                    amountRules: [
                      ...current.amountRules,
                      {
                        paymentNumberInMonth: "",
                        amount: "",
                        currency: current.currency,
                      },
                    ],
                  }))
                }
                type="button"
                variant="outline"
              >
                Add rule
              </Button>
            </div>
            {scheduleForm.amountRules.map((rule, index) => (
              <div
                className="grid gap-3 md:grid-cols-3"
                key={`${index}-${rule.paymentNumberInMonth}`}
              >
                <FieldShell label="Payment number">
                  <TextField
                    min="1"
                    onChange={(value) =>
                      setScheduleForm((current) => ({
                        ...current,
                        amountRules: current.amountRules.map(
                          (item, itemIndex) =>
                            itemIndex === index
                              ? {
                                  ...item,
                                  paymentNumberInMonth: value,
                                }
                              : item
                        ),
                      }))
                    }
                    type="number"
                    value={rule.paymentNumberInMonth}
                  />
                </FieldShell>
                <FieldShell label="Amount">
                  <TextField
                    min="0"
                    onChange={(value) =>
                      setScheduleForm((current) => ({
                        ...current,
                        amountRules: current.amountRules.map(
                          (item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, amount: value }
                              : item
                        ),
                      }))
                    }
                    step="0.01"
                    type="number"
                    value={rule.amount}
                  />
                </FieldShell>
                <FieldShell label="Currency">
                  <div className="flex gap-2">
                    <TextField
                      onChange={(value) =>
                        setScheduleForm((current) => ({
                          ...current,
                          amountRules: current.amountRules.map(
                            (item, itemIndex) =>
                              itemIndex === index
                                ? {
                                    ...item,
                                    currency: value,
                                  }
                                : item
                          ),
                        }))
                      }
                      value={rule.currency}
                    />
                    <Button
                      disabled={scheduleForm.amountRules.length === 1}
                      onClick={() =>
                        setScheduleForm((current) => ({
                          ...current,
                          amountRules: current.amountRules.filter(
                            (_, itemIndex) => itemIndex !== index
                          ),
                        }))
                      }
                      type="button"
                      variant="outline"
                    >
                      Remove
                    </Button>
                  </div>
                </FieldShell>
              </div>
            ))}
          </div>
          <div className="flex flex-col gap-3 md:col-span-2">
            <FormError
              error={
                createScheduleMutation.error ?? updateScheduleMutation.error
              }
            />
            <div className="flex flex-wrap gap-2">
              <Button
                disabled={
                  createScheduleMutation.isPending ||
                  updateScheduleMutation.isPending ||
                  !scheduleForm.anchorPaymentDate ||
                  scheduleForm.amountRules.every(
                    (rule) => !rule.amount.trim()
                  ) ||
                  scheduleForm.amountRules.some(
                    (rule) =>
                      Boolean(rule.amount.trim()) !==
                      Boolean(rule.paymentNumberInMonth.trim())
                  ) ||
                  scheduleForm.amountRules.some(
                    (rule) =>
                      (rule.amount.trim() &&
                        toOptionalPositiveNumber(rule.amount) === undefined) ||
                      (rule.paymentNumberInMonth.trim() &&
                        toOptionalPositiveInteger(rule.paymentNumberInMonth) ===
                          undefined)
                  ) ||
                  (Boolean(scheduleForm.ordinaryMonthGrossIncome.trim()) &&
                    toOptionalPositiveNumber(
                      scheduleForm.ordinaryMonthGrossIncome
                    ) === undefined) ||
                  (Boolean(scheduleForm.ordinaryMonthNetReference.trim()) &&
                    toOptionalPositiveNumber(
                      scheduleForm.ordinaryMonthNetReference
                    ) === undefined)
                }
                onClick={() => void handleSaveSchedule()}
                type="button"
              >
                {createScheduleMutation.isPending ||
                updateScheduleMutation.isPending
                  ? "Saving..."
                  : schedule
                    ? "Save schedule"
                    : "Create schedule"}
              </Button>
              {schedule ? (
                <Button
                  disabled={deleteScheduleMutation.isPending}
                  onClick={() =>
                    void deleteScheduleMutation.mutateAsync(planId)
                  }
                  type="button"
                  variant="destructive"
                >
                  {deleteScheduleMutation.isPending
                    ? "Deleting..."
                    : "Delete schedule"}
                </Button>
              ) : null}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Generate income payments</CardTitle>
          <CardDescription>
            Create projected payments from the current schedule through a target
            date.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 md:flex-row md:items-end">
          <FieldShell className="md:min-w-64" label="Generate through">
            <DatePicker
              onChange={setGenerateThrough}
              required
              value={generateThrough}
            />
          </FieldShell>
          <div className="flex flex-col gap-3">
            <FormError error={generatePaymentsMutation.error} />
            <Button
              disabled={
                generatePaymentsMutation.isPending ||
                !generateThrough ||
                !schedule
              }
              onClick={() =>
                void generatePaymentsMutation.mutateAsync({
                  data: { through: generateThrough },
                  planId,
                })
              }
              type="button"
            >
              {generatePaymentsMutation.isPending
                ? "Generating..."
                : "Generate payments"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Create income payment</CardTitle>
          <CardDescription>
            Use manual entries for one-off corrections or missing payments.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-4">
          <FieldShell label="External ID">
            <TextField
              onChange={(value) =>
                setCreatePaymentForm((current) => ({
                  ...current,
                  externalId: value,
                }))
              }
              value={createPaymentForm.externalId}
            />
          </FieldShell>
          <FieldShell label="Date">
            <DatePicker
              onChange={(value) =>
                setCreatePaymentForm((current) => ({
                  ...current,
                  date: value,
                }))
              }
              required
              value={createPaymentForm.date}
            />
          </FieldShell>
          <FieldShell label="Payment number in month">
            <TextField
              min="1"
              onChange={(value) =>
                setCreatePaymentForm((current) => ({
                  ...current,
                  paymentNumberInMonth: value,
                }))
              }
              type="number"
              value={createPaymentForm.paymentNumberInMonth}
            />
          </FieldShell>
          <FieldShell label="Amount">
            <TextField
              min="0"
              onChange={(value) =>
                setCreatePaymentForm((current) => ({
                  ...current,
                  amount: value,
                }))
              }
              step="0.01"
              type="number"
              value={createPaymentForm.amount}
            />
          </FieldShell>
          <FieldShell label="Currency">
            <TextField
              onChange={(value) =>
                setCreatePaymentForm((current) => ({
                  ...current,
                  currency: value,
                }))
              }
              value={createPaymentForm.currency}
            />
          </FieldShell>
          <FieldShell label="Status">
            <Select
              onValueChange={(value) =>
                setCreatePaymentForm((current) => ({
                  ...current,
                  status: value as PaymentStatus,
                }))
              }
              value={createPaymentForm.status}
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
                setCreatePaymentForm((current) => ({
                  ...current,
                  source: value as PaymentSource,
                }))
              }
              value={createPaymentForm.source}
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
          <div className="flex flex-col gap-3 md:col-span-4">
            <FormError error={createPaymentMutation.error} />
            <Button
              className="w-fit"
              disabled={
                createPaymentMutation.isPending ||
                !createPaymentForm.date ||
                !createPaymentForm.amount.trim() ||
                toOptionalPositiveNumber(createPaymentForm.amount) ===
                  undefined ||
                toOptionalPositiveInteger(
                  createPaymentForm.paymentNumberInMonth
                ) === undefined
              }
              onClick={() => void handleCreatePayment()}
              type="button"
            >
              {createPaymentMutation.isPending
                ? "Creating..."
                : "Create income payment"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {plan.incomePayments.length === 0 ? (
        <EmptyState
          description="No payments exist yet. Generate them from the schedule or create them manually."
          title="No income payments yet"
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {plan.incomePayments.map((payment) => (
            <IncomePaymentCard
              currencyFallback={plan.currency}
              deleteError={deletePaymentMutation.error}
              deletePendingId={
                deletePaymentMutation.variables?.incomePaymentId ?? null
              }
              key={payment.id}
              onDelete={() =>
                void deletePaymentMutation.mutateAsync({
                  incomePaymentId: payment.id,
                  planId,
                })
              }
              onSave={(data) =>
                void updatePaymentMutation.mutateAsync({
                  data,
                  incomePaymentId: payment.id,
                  planId,
                })
              }
              payment={payment}
              saveError={updatePaymentMutation.error}
              savePendingId={
                updatePaymentMutation.variables?.incomePaymentId ?? null
              }
            />
          ))}
        </div>
      )}
    </main>
  )
}

function IncomePaymentCard({
  currencyFallback,
  deleteError,
  deletePendingId,
  onDelete,
  onSave,
  payment,
  saveError,
  savePendingId,
}: {
  currencyFallback: string
  deleteError: Error | null
  deletePendingId: string | null
  onDelete: () => void
  onSave: (data: UpdateIncomePaymentDto) => void
  payment: IncomePaymentResponseDto
  saveError: Error | null
  savePendingId: string | null
}) {
  const [form, setForm] = useState<PaymentForm>({
    amount: payment.amount.toString(),
    currency: readText(payment.currency) || currencyFallback,
    date: readText(payment.date),
    externalId: readText(payment.externalId),
    paymentNumberInMonth: payment.paymentNumberInMonth.toString(),
    source: payment.source,
    status: payment.status,
  })

  const isSaving = savePendingId === payment.id
  const isDeleting = deletePendingId === payment.id

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <CardTitle>
              {formatCurrency(payment.amount, payment.currency)}
            </CardTitle>
            <CardDescription>{payment.date}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <StatusBadge value={payment.status} />
            <StatusBadge value={payment.source} />
          </div>
        </div>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
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
        <FieldShell label="Date">
          <DatePicker
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                date: value,
              }))
            }
            required
            value={form.date}
          />
        </FieldShell>
        <FieldShell label="Payment number in month">
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
              setForm((current) => ({
                ...current,
                amount: value,
              }))
            }
            step="0.01"
            type="number"
            value={form.amount}
          />
        </FieldShell>
        <FieldShell label="Currency">
          <TextField
            onChange={(value) =>
              setForm((current) => ({
                ...current,
                currency: value,
              }))
            }
            value={form.currency}
          />
        </FieldShell>
        <FieldShell label="Status">
          <Select
            onValueChange={(value) =>
              setForm((current) => ({
                ...current,
                status: value as PaymentStatus,
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
                source: value as PaymentSource,
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
        <div className="flex flex-col gap-3 md:col-span-2">
          <FormError error={saveError ?? deleteError} />
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={
                isSaving ||
                !form.date ||
                !form.amount.trim() ||
                toOptionalPositiveNumber(form.amount) === undefined ||
                toOptionalPositiveInteger(form.paymentNumberInMonth) ===
                  undefined
              }
              onClick={() =>
                onSave({
                  amount: toOptionalPositiveNumber(form.amount),
                  currency: toOptionalString(form.currency),
                  date: toOptionalString(form.date),
                  externalId: toOptionalString(form.externalId),
                  paymentNumberInMonth: toOptionalPositiveInteger(
                    form.paymentNumberInMonth
                  ),
                  source: form.source,
                  status: form.status,
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
        </div>
      </CardContent>
    </Card>
  )
}
