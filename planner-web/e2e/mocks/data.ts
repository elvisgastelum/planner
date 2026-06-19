import {
  getAccountResponseDtoMock,
  getBudgetItemResponseDtoMock,
  getBudgetPeriodResponseDtoMock,
  getCategoryResponseDtoMock,
  getCurrentBalanceResponseDtoMock,
  getDashboardResponseDtoMock,
  getIncomePaymentResponseDtoMock,
  getIncomeSourceResponseDtoMock,
  getPlanResponseDtoMock,
  getRecurringItemResponseDtoMock,
} from "../../src/api/generated/model/index.faker"

export const ids = {
  planId: "plan-e2e",
  accountId: "account-checking",
  categoryId: "category-housing",
  periodId: "period-january",
  itemId: "item-rent",
  recurringExpenseId: "recurring-rent",
  incomePaymentId: "income-payment-january",
  incomeSourceId: "income-source-salary",
  scheduleId: "schedule-monthly",
}

export const e2eData = {
  health: {
    status: "ok",
    info: { database: { status: "up" } },
    error: {},
    details: { database: { status: "up" } },
  },

  plan: getPlanResponseDtoMock({
    id: ids.planId,
    name: "E2E Financial Plan",
    baseCurrency: "USD",
    startDate: "2026-01-01",
    endDate: null,
    status: "active",
    objective: "Test plan for E2E testing",
  }),

  accounts: [
    getAccountResponseDtoMock({
      id: ids.accountId,
      name: "Checking Account",
      accountType: "checking",
      currency: "USD",
      status: "active",
    }),
  ],

  categories: [
    getCategoryResponseDtoMock({
      id: ids.categoryId,
      code: "housing",
      name: "Housing",
      idealPercentageBps: 3000,
      description: "Rent and utilities",
    }),
  ],

  incomeSources: [
    getIncomeSourceResponseDtoMock({
      id: ids.incomeSourceId,
      name: "Salary",
      currency: "USD",
      defaultDepositAccountId: ids.accountId,
      active: true,
    }),
  ],

  incomePayments: [
    getIncomePaymentResponseDtoMock({
      id: ids.incomePaymentId,
      incomeSourceId: ids.incomeSourceId,
      amountCents: 500000,
      paidOn: "2026-01-15",
      status: "received",
    }),
  ],

  budgetPeriods: [
    getBudgetPeriodResponseDtoMock({
      id: ids.periodId,
      periodType: "monthly",
      startsOn: "2026-01-01",
      endsOn: "2026-01-31",
      fundingAmountCents: 500000,
      plannedTotalCents: 350000,
      unallocatedCents: 150000,
      status: "open",
    }),
  ],

  budgetItems: [
    getBudgetItemResponseDtoMock({
      id: ids.itemId,
      budgetPeriodId: ids.periodId,
      categoryId: ids.categoryId,
      dueOn: "2026-01-05",
      concept: "Rent",
      plannedAmountCents: 150000,
      status: "active",
    }),
  ],

  recurringItems: [
    getRecurringItemResponseDtoMock({
      id: ids.recurringExpenseId,
      itemType: "expense",
      concept: "Monthly Rent",
      amountCents: 150000,
      recurrenceRule: "FREQ=MONTHLY;BYMONTHDAY=5",
      categoryId: ids.categoryId,
      active: true,
    }),
  ],

  dashboard: getDashboardResponseDtoMock({
    plan: getPlanResponseDtoMock({
      id: ids.planId,
      name: "E2E Financial Plan",
    }),
    accounts: [
      getAccountResponseDtoMock({
        id: ids.accountId,
        name: "Checking Account",
      }),
    ],
    categories: [
      getCategoryResponseDtoMock({
        id: ids.categoryId,
        name: "Housing",
      }),
    ],
    currentBalances: [
      getCurrentBalanceResponseDtoMock({
        accountId: ids.accountId,
        accountName: "Checking Account",
        balanceCents: 500000,
      }),
    ],
    recentIncomePayments: [
      getIncomePaymentResponseDtoMock({
        id: ids.incomePaymentId,
        amountCents: 500000,
      }),
    ],
    recentTransactions: [],
    recurringItems: [
      getRecurringItemResponseDtoMock({
        id: ids.recurringExpenseId,
        concept: "Monthly Rent",
      }),
    ],
  }),
}
