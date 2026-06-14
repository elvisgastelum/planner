import type {
  CompletedItemResponseDto,
  FinancialPlanResponseDto,
  IncomePaymentResponseDto,
  PaymentPeriodSummaryResponseDto,
} from "@/api/generated/model"

import type { PlanOverview } from "./plan.types"

export function mapPlanOverviewDataToOverview(
  plan: FinancialPlanResponseDto,
  paymentPeriods: PaymentPeriodSummaryResponseDto[],
  incomePayments: IncomePaymentResponseDto[],
  completedItems: CompletedItemResponseDto[],
  accountsCount: number,
  recurringExpensesCount: number
): PlanOverview {
  const plannedTotal = paymentPeriods.reduce(
    (total, period) => total + period.plannedTotal,
    0
  )
  const plannedRemaining = paymentPeriods.reduce(
    (total, period) => total + period.plannedRemaining,
    0
  )
  const completedTotal = completedItems.reduce(
    (total, item) => total + item.amount,
    0
  )
  const nextIncomeDate = incomePayments
    .map((payment) => payment.date)
    .filter((date) => date >= new Date().toISOString().slice(0, 10))
    .sort()[0]

  return {
    id: plan.id,
    metadataId: plan.metadataId,
    name: plan.name,
    currency: plan.currency,
    status: plan.status,
    startDate: plan.startDate,
    endDate: plan.endDate,
    objective: plan.objective,
    accountsCount,
    incomePaymentsCount: incomePayments.length,
    paymentPeriodsCount: paymentPeriods.length,
    recurringExpensesCount,
    completedItemsCount: completedItems.length,
    plannedTotal,
    plannedRemaining,
    completedTotal,
    nextIncomeDate: nextIncomeDate ?? null,
  }
}
