export type PlanOverview = {
  id: string
  name: string
  currency: string
  status: string
  startDate: string
  endDate: unknown
  accountsCount: number
  incomePaymentsCount: number
  paymentPeriodsCount: number
  recurringExpensesCount: number
  completedItemsCount: number
  plannedTotal: number
  plannedRemaining: number
  completedTotal: number
  nextIncomeDate: string | null
}
