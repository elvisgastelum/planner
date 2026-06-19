// Individual mock handlers from health
import { getHealthControllerCheckV1MockHandler } from "../../src/api/generated/endpoints/health/health.msw"
// Individual mock handlers from plans
import {
  // Accounts
  getPlannerControllerCreateAccountV1MockHandler,
  // Budget Items
  getPlannerControllerCreateBudgetItemV1MockHandler,
  // Budget Periods
  getPlannerControllerCreateBudgetPeriodV1MockHandler,
  // Categories
  getPlannerControllerCreateCategoryV1MockHandler,
  // Income Payments
  getPlannerControllerCreateIncomePaymentV1MockHandler,
  // Income Sources
  getPlannerControllerCreateIncomeSourceV1MockHandler,
  // Plans
  getPlannerControllerCreatePlanV1MockHandler,
  // Recurring Items
  getPlannerControllerCreateRecurringItemV1MockHandler,
  getPlannerControllerFulfillBudgetItemV1MockHandler,
  getPlannerControllerGetAccountV1MockHandler,
  getPlannerControllerGetBudgetItemV1MockHandler,
  getPlannerControllerGetBudgetPeriodV1MockHandler,
  // Dashboard
  getPlannerControllerGetDashboardV1MockHandler,
  getPlannerControllerGetIncomePaymentV1MockHandler,
  getPlannerControllerGetPlanV1MockHandler,
  getPlannerControllerGetRecurringItemV1MockHandler,
  getPlannerControllerListAccountsV1MockHandler,
  getPlannerControllerListBudgetItemsV1MockHandler,
  getPlannerControllerListBudgetPeriodsV1MockHandler,
  getPlannerControllerListCategoriesV1MockHandler,
  getPlannerControllerListIncomePaymentsV1MockHandler,
  getPlannerControllerListIncomeSourcesV1MockHandler,
  getPlannerControllerListPlansV1MockHandler,
  getPlannerControllerListRecurringItemsV1MockHandler,
  getPlannerControllerUpdateAccountV1MockHandler,
  getPlannerControllerUpdateBudgetItemV1MockHandler,
  getPlannerControllerUpdateBudgetPeriodV1MockHandler,
  getPlannerControllerUpdateCategoryV1MockHandler,
  getPlannerControllerUpdateIncomePaymentV1MockHandler,
  getPlannerControllerUpdateIncomeSourceV1MockHandler,
  getPlannerControllerUpdatePlanV1MockHandler,
  getPlannerControllerUpdateRecurringItemV1MockHandler,
} from "../../src/api/generated/endpoints/plans/plans.msw"
import { e2eData,ids } from "./data"

export const getE2eGeneratedHandlers = () => [
  // Health
  getHealthControllerCheckV1MockHandler(e2eData.health),

  // Plans - Create/Update
  getPlannerControllerCreatePlanV1MockHandler(e2eData.plan),
  getPlannerControllerListPlansV1MockHandler([e2eData.plan]),
  getPlannerControllerGetPlanV1MockHandler(e2eData.plan),
  getPlannerControllerUpdatePlanV1MockHandler(e2eData.plan),

  // Dashboard
  getPlannerControllerGetDashboardV1MockHandler(e2eData.dashboard),

  // Accounts - Create/Update
  getPlannerControllerCreateAccountV1MockHandler(e2eData.accounts[0]),
  getPlannerControllerListAccountsV1MockHandler(e2eData.accounts),
  getPlannerControllerGetAccountV1MockHandler(e2eData.accounts[0]),
  getPlannerControllerUpdateAccountV1MockHandler(e2eData.accounts[0]),

  // Categories - Create/Update
  getPlannerControllerCreateCategoryV1MockHandler(e2eData.categories[0]),
  getPlannerControllerListCategoriesV1MockHandler(e2eData.categories),
  getPlannerControllerUpdateCategoryV1MockHandler(e2eData.categories[0]),

  // Income Sources - Create/Update
  getPlannerControllerCreateIncomeSourceV1MockHandler(e2eData.incomeSources[0]),
  getPlannerControllerListIncomeSourcesV1MockHandler(e2eData.incomeSources),
  getPlannerControllerUpdateIncomeSourceV1MockHandler(e2eData.incomeSources[0]),

  // Income Payments - Create/Update
  getPlannerControllerCreateIncomePaymentV1MockHandler(e2eData.incomePayments[0]),
  getPlannerControllerListIncomePaymentsV1MockHandler(e2eData.incomePayments),
  getPlannerControllerGetIncomePaymentV1MockHandler(e2eData.incomePayments[0]),
  getPlannerControllerUpdateIncomePaymentV1MockHandler(e2eData.incomePayments[0]),

  // Budget Periods - Create/Update
  getPlannerControllerCreateBudgetPeriodV1MockHandler(e2eData.budgetPeriods[0]),
  getPlannerControllerListBudgetPeriodsV1MockHandler(e2eData.budgetPeriods),
  getPlannerControllerGetBudgetPeriodV1MockHandler(e2eData.budgetPeriods[0]),
  getPlannerControllerUpdateBudgetPeriodV1MockHandler(e2eData.budgetPeriods[0]),

  // Budget Items - Create/Update
  getPlannerControllerCreateBudgetItemV1MockHandler(e2eData.budgetItems[0]),
  getPlannerControllerListBudgetItemsV1MockHandler(e2eData.budgetItems),
  getPlannerControllerGetBudgetItemV1MockHandler(e2eData.budgetItems[0]),
  getPlannerControllerUpdateBudgetItemV1MockHandler(e2eData.budgetItems[0]),
  getPlannerControllerFulfillBudgetItemV1MockHandler({
    id: "transaction-1",
    budgetItemId: ids.itemId,
    transactionId: "transaction-1",
    allocatedAmountCents: 150000,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
  }),

  // Recurring Items - Create/Update
  getPlannerControllerCreateRecurringItemV1MockHandler(e2eData.recurringItems[0]),
  getPlannerControllerListRecurringItemsV1MockHandler(e2eData.recurringItems),
  getPlannerControllerGetRecurringItemV1MockHandler(e2eData.recurringItems[0]),
  getPlannerControllerUpdateRecurringItemV1MockHandler(e2eData.recurringItems[0]),
]
