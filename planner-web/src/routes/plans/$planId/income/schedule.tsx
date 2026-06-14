import { useMutation, useSuspenseQuery } from "@tanstack/react-query"
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router"
import { ArrowLeft, Trash2 } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

import {
  CreateIncomeScheduleDtoCadence,
  type FinancialPlanResponseDto,
  type IncomeScheduleResponseDto,
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

export const Route = createFileRoute("/plans/$planId/income/schedule")({
  loader: ({ context, params }) =>
    Promise.all([
      context.queryClient.ensureQueryData(planQueries.detail(params.planId)),
      context.queryClient.ensureQueryData(
        planQueries.incomeSchedule(params.planId)
      ),
    ]),
  pendingComponent: ResourcePageSkeleton,
  component: IncomeSchedulePage,
})

const scheduleCadences = Object.values(CreateIncomeScheduleDtoCadence)
type ScheduleCadence =
  (typeof CreateIncomeScheduleDtoCadence)[keyof typeof CreateIncomeScheduleDtoCadence]

function getScheduleForm(
  plan: FinancialPlanResponseDto,
  schedule: IncomeScheduleResponseDto | null | undefined
) {
  if (!schedule) {
    return {
      amountRules: [
        { amount: "", currency: plan.currency, paymentNumberInMonth: "1" },
      ],
      anchorPaymentDate: plan.startDate,
      cadence: CreateIncomeScheduleDtoCadence.every_14_days,
      calculationRule: "",
      currency: plan.currency,
      ordinaryMonthGrossIncome: "",
      ordinaryMonthNetReference: "",
    }
  }

  return {
    amountRules:
      schedule.amountRules.length > 0
        ? schedule.amountRules.map((rule) => ({
            amount: rule.amount.toString(),
            currency: readText(rule.currency) || readText(schedule.currency),
            paymentNumberInMonth: rule.paymentNumberInMonth.toString(),
          }))
        : [
            {
              amount: "",
              currency: readText(schedule.currency),
              paymentNumberInMonth: "1",
            },
          ],
    anchorPaymentDate: readText(schedule.anchorPaymentDate),
    cadence: schedule.cadence,
    calculationRule: readText(schedule.calculationRule),
    currency: readText(schedule.currency),
    ordinaryMonthGrossIncome:
      schedule.ordinaryMonthGrossIncome?.toString() ?? "",
    ordinaryMonthNetReference:
      schedule.ordinaryMonthNetReference?.toString() ?? "",
  }
}

function IncomeSchedulePage() {
  const navigate = useNavigate()
  const { planId } = Route.useParams()
  const { data: plan } = useSuspenseQuery(planQueries.detail(planId))
  const { data: schedule } = useSuspenseQuery(
    planQueries.incomeSchedule(planId)
  )
  const createScheduleMutation = useMutation(
    planMutations.createIncomeSchedule()
  )
  const updateScheduleMutation = useMutation(
    planMutations.updateIncomeSchedule()
  )
  const deleteScheduleMutation = useMutation(
    planMutations.deleteIncomeSchedule()
  )
  const [form, setForm] = useState(() => getScheduleForm(plan, schedule))

  async function handleSave() {
    const payload = {
      amountRules: form.amountRules
        .map((rule) => {
          const amount = toOptionalPositiveNumber(rule.amount)
          const paymentNumberInMonth = toOptionalPositiveInteger(
            rule.paymentNumberInMonth
          )
          if (amount === undefined || paymentNumberInMonth === undefined)
            return null
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
      anchorPaymentDate: form.anchorPaymentDate,
      cadence: form.cadence,
      calculationRule: toOptionalString(form.calculationRule),
      currency: toOptionalString(form.currency),
      ordinaryMonthGrossIncome: toOptionalPositiveNumber(
        form.ordinaryMonthGrossIncome
      ),
      ordinaryMonthNetReference: toOptionalPositiveNumber(
        form.ordinaryMonthNetReference
      ),
    }

    try {
      if (schedule) {
        await updateScheduleMutation.mutateAsync({ data: payload, planId })
        toast.success("Income schedule updated.")
      } else {
        await createScheduleMutation.mutateAsync({ data: payload, planId })
        toast.success("Income schedule created.")
      }
      await navigate({ params: { planId }, to: "/plans/$planId/income" })
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to save income schedule."
      )
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-col gap-6 p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Income schedule</h1>
          <p className="text-sm text-muted-foreground">
            Edit cadence and amount rules here.
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
          <CardTitle>
            {schedule ? "Update schedule" : "Create schedule"}
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <FieldShell label="Cadence">
            <Select
              onValueChange={(value) =>
                setForm((current) => ({
                  ...current,
                  cadence: value as ScheduleCadence,
                }))
              }
              value={form.cadence}
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
          <FieldShell label="Anchor date">
            <DatePicker
              onChange={(value) =>
                setForm((current) => ({ ...current, anchorPaymentDate: value }))
              }
              required
              value={form.anchorPaymentDate}
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
          <FieldShell label="Gross income">
            <TextField
              min="0"
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  ordinaryMonthGrossIncome: value,
                }))
              }
              step="0.01"
              type="number"
              value={form.ordinaryMonthGrossIncome}
            />
          </FieldShell>
          <FieldShell label="Net reference">
            <TextField
              min="0"
              onChange={(value) =>
                setForm((current) => ({
                  ...current,
                  ordinaryMonthNetReference: value,
                }))
              }
              step="0.01"
              type="number"
              value={form.ordinaryMonthNetReference}
            />
          </FieldShell>
          <FieldShell label="Calculation rule">
            <TextField
              onChange={(value) =>
                setForm((current) => ({ ...current, calculationRule: value }))
              }
              value={form.calculationRule}
            />
          </FieldShell>
          <div className="grid gap-3 md:col-span-2">
            <h3 className="font-medium">Amount rules</h3>
            {form.amountRules.map((rule, index) => (
              <div className="grid gap-3 md:grid-cols-3" key={index}>
                <FieldShell label="Payment number">
                  <TextField
                    min="1"
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        amountRules: current.amountRules.map(
                          (item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, paymentNumberInMonth: value }
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
                      setForm((current) => ({
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
                  <TextField
                    onChange={(value) =>
                      setForm((current) => ({
                        ...current,
                        amountRules: current.amountRules.map(
                          (item, itemIndex) =>
                            itemIndex === index
                              ? { ...item, currency: value }
                              : item
                        ),
                      }))
                    }
                    value={rule.currency}
                  />
                </FieldShell>
              </div>
            ))}
          </div>
          <FormError
            error={
              createScheduleMutation.error ??
              updateScheduleMutation.error ??
              deleteScheduleMutation.error
            }
          />
          <div className="flex flex-wrap gap-2 md:col-span-2">
            <Button onClick={() => void handleSave()} type="button">
              {schedule ? "Save schedule" : "Create schedule"}
            </Button>
            {schedule ? (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    disabled={deleteScheduleMutation.isPending}
                    type="button"
                    variant="destructive"
                  >
                    <Trash2 />
                    Delete schedule
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete income schedule?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will remove the schedule and its rules.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={deleteScheduleMutation.isPending}
                      onClick={() =>
                        void (async () => {
                          try {
                            await deleteScheduleMutation.mutateAsync(planId)
                            toast.success("Income schedule deleted.")
                            await navigate({
                              params: { planId },
                              to: "/plans/$planId/income",
                            })
                          } catch (error) {
                            toast.error(
                              error instanceof Error
                                ? error.message
                                : "Failed to delete income schedule."
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
            ) : null}
          </div>
        </CardContent>
      </Card>
    </main>
  )
}
