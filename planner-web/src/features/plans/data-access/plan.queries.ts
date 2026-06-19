import { queryOptions } from "@tanstack/react-query"

import {
  plannerControllerGetBudgetItemV1,
  plannerControllerGetDashboardV1,
  plannerControllerGetIncomePaymentV1,
  plannerControllerGetPlanV1,
  plannerControllerGetRecurringItemV1,
  plannerControllerListAccountsV1,
  plannerControllerListBudgetItemsV1,
  plannerControllerListBudgetPeriodsV1,
  plannerControllerListCategoriesV1,
  plannerControllerListIncomePaymentsV1,
  plannerControllerListIncomeSourcesV1,
  plannerControllerListPlansV1,
  plannerControllerListRecurringItemsV1,
} from "@/api/generated/endpoints/plans/plans"
import {
  PlannerControllerGetBudgetItemV1Response,
  PlannerControllerGetDashboardV1Response,
  PlannerControllerGetIncomePaymentV1Response,
  PlannerControllerGetPlanV1Response,
  PlannerControllerGetRecurringItemV1Response,
  PlannerControllerListAccountsV1Response,
  PlannerControllerListBudgetItemsV1Response,
  PlannerControllerListBudgetPeriodsV1Response,
  PlannerControllerListCategoriesV1Response,
  PlannerControllerListIncomePaymentsV1Response,
  PlannerControllerListIncomeSourcesV1Response,
  PlannerControllerListPlansV1Response,
  PlannerControllerListRecurringItemsV1Response,
} from "@/api/generated/endpoints/plans/plans.zod"
import { unwrapResponse } from "@/api/response"

import { planKeys } from "./plan.keys"

export const planQueries = {
  list: () =>
    queryOptions({
      queryKey: planKeys.list(),
      queryFn: async ({ signal }) => {
        const response = await plannerControllerListPlansV1({ signal })

        return PlannerControllerListPlansV1Response.parse(
          unwrapResponse(response, 200)
        )
      },
      staleTime: 30_000,
    }),
  detail: (planId: string) =>
    queryOptions({
      queryKey: planKeys.detail(planId),
      queryFn: async ({ signal }) => {
        const response = await plannerControllerGetPlanV1(planId, { signal })

        return PlannerControllerGetPlanV1Response.parse(
          unwrapResponse(response, 200)
        )
      },
      staleTime: 30_000,
    }),
  dashboard: (planId: string) =>
    queryOptions({
      queryKey: planKeys.dashboard(planId),
      queryFn: async ({ signal }) => {
        const response = await plannerControllerGetDashboardV1(planId, {
          signal,
        })

        return PlannerControllerGetDashboardV1Response.parse(
          unwrapResponse(response, 200)
        )
      },
      staleTime: 30_000,
    }),
  accounts: (planId: string) =>
    queryOptions({
      queryKey: planKeys.accounts(planId),
      queryFn: async ({ signal }) => {
        const response = await plannerControllerListAccountsV1(planId, {
          signal,
        })

        return PlannerControllerListAccountsV1Response.parse(
          unwrapResponse(response, 200)
        )
      },
      staleTime: 30_000,
    }),
  incomeSources: (planId: string) =>
    queryOptions({
      queryKey: planKeys.incomeSources(planId),
      queryFn: async ({ signal }) => {
        const response = await plannerControllerListIncomeSourcesV1(planId, {
          signal,
        })

        return PlannerControllerListIncomeSourcesV1Response.parse(
          unwrapResponse(response, 200)
        )
      },
      staleTime: 30_000,
    }),
  incomePayments: (planId: string) =>
    queryOptions({
      queryKey: planKeys.incomePayments(planId),
      queryFn: async ({ signal }) => {
        const response = await plannerControllerListIncomePaymentsV1(planId, {
          signal,
        })

        return PlannerControllerListIncomePaymentsV1Response.parse(
          unwrapResponse(response, 200)
        )
      },
      staleTime: 30_000,
    }),
  categories: (planId: string) =>
    queryOptions({
      queryKey: planKeys.categories(planId),
      queryFn: async ({ signal }) => {
        const response = await plannerControllerListCategoriesV1(planId, {
          signal,
        })

        return PlannerControllerListCategoriesV1Response.parse(
          unwrapResponse(response, 200)
        )
      },
      staleTime: 30_000,
    }),
  budgetPeriods: (planId: string) =>
    queryOptions({
      queryKey: planKeys.budgetPeriods(planId),
      queryFn: async ({ signal }) => {
        const response = await plannerControllerListBudgetPeriodsV1(planId, {
          signal,
        })

        return PlannerControllerListBudgetPeriodsV1Response.parse(
          unwrapResponse(response, 200)
        )
      },
      staleTime: 30_000,
    }),
  budgetItems: (planId: string, periodId: string) =>
    queryOptions({
      queryKey: planKeys.budgetItems(planId, periodId),
      queryFn: async ({ signal }) => {
        const response = await plannerControllerListBudgetItemsV1(
          planId,
          periodId,
          { signal }
        )

        return PlannerControllerListBudgetItemsV1Response.parse(
          unwrapResponse(response, 200)
        )
      },
      staleTime: 30_000,
    }),
  recurringItems: (planId: string) =>
    queryOptions({
      queryKey: planKeys.recurringItems(planId),
      queryFn: async ({ signal }) => {
        const response = await plannerControllerListRecurringItemsV1(planId, {
          signal,
        })

        return PlannerControllerListRecurringItemsV1Response.parse(
          unwrapResponse(response, 200)
        )
      },
      staleTime: 30_000,
    }),
  incomePayment: (planId: string, incomePaymentId: string) =>
    queryOptions({
      queryKey: planKeys.incomePayment(planId, incomePaymentId),
      queryFn: async ({ signal }) => {
        const response = await plannerControllerGetIncomePaymentV1(
          planId,
          incomePaymentId,
          { signal }
        )

        return PlannerControllerGetIncomePaymentV1Response.parse(
          unwrapResponse(response, 200)
        )
      },
      staleTime: 30_000,
    }),
  budgetItem: (planId: string, periodId: string, itemId: string) =>
    queryOptions({
      queryKey: planKeys.budgetItem(planId, periodId, itemId),
      queryFn: async ({ signal }) => {
        const response = await plannerControllerGetBudgetItemV1(
          planId,
          periodId,
          itemId,
          { signal }
        )

        return PlannerControllerGetBudgetItemV1Response.parse(
          unwrapResponse(response, 200)
        )
      },
      staleTime: 30_000,
    }),
  recurringItem: (planId: string, recurringItemId: string) =>
    queryOptions({
      queryKey: planKeys.recurringItem(planId, recurringItemId),
      queryFn: async ({ signal }) => {
        const response = await plannerControllerGetRecurringItemV1(
          planId,
          recurringItemId,
          { signal }
        )

        return PlannerControllerGetRecurringItemV1Response.parse(
          unwrapResponse(response, 200)
        )
      },
      staleTime: 30_000,
    }),
}
