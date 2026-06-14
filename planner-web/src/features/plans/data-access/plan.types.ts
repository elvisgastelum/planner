export type PlanOverview = {
  id: string
  metadataId: string
  name: string
  currency: string
  status: "active" | "archived" | "draft"
  startDate: string
  endDate: unknown
  objective: string | null
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
