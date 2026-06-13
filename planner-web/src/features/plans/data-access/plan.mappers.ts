import type { FinancialPlanDetailResponseDto } from "@/api/generated/model"

import type { PlanOverview } from "./plan.types"

export function mapPlanDetailToOverview(
  plan: FinancialPlanDetailResponseDto
): PlanOverview {
  const plannedTotal = plan.paymentPeriods.reduce(
    (total, period) => total + period.plannedTotal,
    0
  )
  const plannedRemaining = plan.paymentPeriods.reduce(
    (total, period) => total + period.plannedRemaining,
    0
  )
  const completedTotal = plan.completedItems.reduce(
    (total, item) => total + item.amount,
    0
  )
  const nextIncomeDate = plan.incomePayments
    .map((payment) => payment.date)
    .filter((date) => date >= new Date().toISOString().slice(0, 10))
    .sort()[0]

  return {
    id: plan.id,
    name: plan.name,
    currency: plan.currency,
    status: plan.status,
    startDate: plan.startDate,
    endDate: plan.endDate,
    accountsCount: plan.accounts.length,
    incomePaymentsCount: plan.incomePayments.length,
    paymentPeriodsCount: plan.paymentPeriods.length,
    recurringExpensesCount: plan.recurringExpenses.length,
    completedItemsCount: plan.completedItems.length,
    plannedTotal,
    plannedRemaining,
    completedTotal,
    nextIncomeDate: nextIncomeDate ?? null,
  }
}
