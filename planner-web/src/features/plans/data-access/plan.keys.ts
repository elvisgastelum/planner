export const planKeys = {
  all: ["plans"] as const,
  lists: () => [...planKeys.all, "list"] as const,
  list: () => [...planKeys.lists()] as const,
  details: () => [...planKeys.all, "detail"] as const,
  detail: (planId: string) => [...planKeys.details(), planId] as const,
  overview: (planId: string) =>
    [...planKeys.detail(planId), "overview"] as const,
  resource: (planId: string, resource: string) =>
    [...planKeys.detail(planId), resource] as const,
  accounts: (planId: string) => planKeys.resource(planId, "accounts"),
  incomeSchedule: (planId: string) =>
    planKeys.resource(planId, "income-schedule"),
  incomePayments: (planId: string) =>
    planKeys.resource(planId, "income-payments"),
  paymentPeriods: (planId: string) =>
    planKeys.resource(planId, "payment-periods"),
  paymentPeriod: (periodId: string) =>
    [...planKeys.all, "payment-period", periodId] as const,
  paymentPeriodItems: (periodId: string) =>
    [...planKeys.paymentPeriod(periodId), "items"] as const,
  recurringExpenses: (planId: string) =>
    planKeys.resource(planId, "recurring-expenses"),
  categories: (planId: string) => planKeys.resource(planId, "categories"),
  completedItems: (planId: string) =>
    planKeys.resource(planId, "completed-items"),
}
