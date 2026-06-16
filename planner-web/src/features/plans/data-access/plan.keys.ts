export const planKeys = {
  all: ["plans"] as const,
  lists: () => [...planKeys.all, "list"] as const,
  list: () => [...planKeys.lists()] as const,
  details: () => [...planKeys.all, "detail"] as const,
  detail: (planId: string) => [...planKeys.details(), planId] as const,
  editForm: (planId: string) =>
    [...planKeys.detail(planId), "edit-form"] as const,
  overview: (planId: string) =>
    [...planKeys.detail(planId), "overview"] as const,
  resource: (planId: string, resource: string) =>
    [...planKeys.detail(planId), resource] as const,
  accounts: (planId: string) => planKeys.resource(planId, "accounts"),
  incomeSchedule: (planId: string) =>
    planKeys.resource(planId, "income-schedule"),
  incomePayments: (planId: string) =>
    planKeys.resource(planId, "income-payments"),
  incomePayment: (planId: string, incomePaymentId: string) =>
    [...planKeys.incomePayments(planId), incomePaymentId] as const,
  paymentPeriods: (planId: string) =>
    planKeys.resource(planId, "payment-periods"),
  paymentPeriod: (periodId: string) =>
    [...planKeys.all, "payment-period", periodId] as const,
  paymentPeriodItems: (periodId: string) =>
    [...planKeys.paymentPeriod(periodId), "items"] as const,
  paymentPeriodItem: (itemId: string) =>
    [...planKeys.all, "payment-period-item", itemId] as const,
  incomePaymentRefs: (planId: string) =>
    [...planKeys.detail(planId), "income-payment-refs"] as const,
  incomePaymentsSummary: (planId: string) =>
    [...planKeys.detail(planId), "income-payments-summary"] as const,
  recurringExpenses: (planId: string) =>
    planKeys.resource(planId, "recurring-expenses"),
  recurringExpenseList: (planId: string) =>
    [...planKeys.resource(planId, "recurring-expenses"), "list"] as const,
  recurringExpense: (planId: string, recurringExpenseId: string) =>
    [...planKeys.recurringExpenses(planId), recurringExpenseId] as const,
  categories: (planId: string) => planKeys.resource(planId, "categories"),
  categoriesLight: (planId: string) =>
    planKeys.resource(planId, "categories/light"),
  stats: (planId: string) => [...planKeys.detail(planId), "stats"] as const,
  completedItems: (planId: string) =>
    planKeys.resource(planId, "completed-items"),
}
