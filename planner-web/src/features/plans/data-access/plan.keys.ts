export const planKeys = {
  all: ["plans"] as const,
  lists: () => [...planKeys.all, "list"] as const,
  list: () => [...planKeys.lists()] as const,
  details: () => [...planKeys.all, "detail"] as const,
  detail: (planId: string) => [...planKeys.details(), planId] as const,
  editForm: (planId: string) =>
    [...planKeys.detail(planId), "edit-form"] as const,
  dashboard: (planId: string) =>
    [...planKeys.detail(planId), "dashboard"] as const,
  accounts: (planId: string) => planKeys.resource(planId, "accounts"),
  account: (planId: string, accountId: string) =>
    [...planKeys.accounts(planId), accountId] as const,
  currentBalance: (planId: string, accountId: string) =>
    [...planKeys.account(planId, accountId), "current-balance"] as const,
  balanceSnapshots: (planId: string, accountId: string) =>
    [...planKeys.account(planId, accountId), "balance-snapshots"] as const,
  incomeSources: (planId: string) =>
    planKeys.resource(planId, "income-sources"),
  incomeSchedules: (planId: string, incomeSourceId: string) =>
    [
      ...planKeys.resource(planId, "income-sources"),
      incomeSourceId,
      "schedules",
    ] as const,
  incomePayments: (planId: string) =>
    planKeys.resource(planId, "income-payments"),
  incomePayment: (planId: string, incomePaymentId: string) =>
    [...planKeys.incomePayments(planId), incomePaymentId] as const,
  budgetPeriods: (planId: string) =>
    planKeys.resource(planId, "budget-periods"),
  budgetPeriod: (planId: string, periodId: string) =>
    [...planKeys.budgetPeriods(planId), periodId] as const,
  budgetItems: (planId: string, periodId: string) =>
    [...planKeys.budgetPeriod(planId, periodId), "items"] as const,
  budgetItem: (planId: string, periodId: string, itemId: string) =>
    [...planKeys.budgetItems(planId, periodId), itemId] as const,
  recurringItems: (planId: string) =>
    planKeys.resource(planId, "recurring-items"),
  recurringItem: (planId: string, recurringItemId: string) =>
    [...planKeys.recurringItems(planId), recurringItemId] as const,
  liabilityTerms: (planId: string, accountId: string) =>
    [...planKeys.account(planId, accountId), "liability-terms"] as const,
  categories: (planId: string) => planKeys.resource(planId, "categories"),
  resource: (planId: string, resource: string) =>
    [...planKeys.detail(planId), resource] as const,
}
