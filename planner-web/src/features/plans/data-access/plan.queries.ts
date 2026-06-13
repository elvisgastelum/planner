import { queryOptions } from "@tanstack/react-query"

import {
  plannerControllerFindAccountsV1,
  plannerControllerFindIncomePaymentsV1,
  plannerControllerFindIncomeScheduleV1,
  plannerControllerFindPaymentPeriodItemsV1,
  plannerControllerFindPaymentPeriodsV1,
  plannerControllerFindPaymentPeriodV1,
  plannerControllerFindPlansV1,
  plannerControllerFindPlanV1,
  plannerControllerFindRecurringExpensesV1,
} from "@/api/generated/endpoints/plans/plans"
import {
  PlannerControllerFindAccountsV1Response,
  PlannerControllerFindIncomePaymentsV1Response,
  PlannerControllerFindIncomeScheduleV1Response,
  PlannerControllerFindPaymentPeriodItemsV1Response,
  PlannerControllerFindPaymentPeriodsV1Response,
  PlannerControllerFindPaymentPeriodV1Response,
  PlannerControllerFindPlansV1Response,
  PlannerControllerFindPlanV1Response,
  PlannerControllerFindRecurringExpensesV1Response,
} from "@/api/generated/endpoints/plans/plans.zod"
import { unwrapResponse } from "@/api/response"

import { planKeys } from "./plan.keys"
import { mapPlanDetailToOverview } from "./plan.mappers"

export const planQueries = {
  list: () =>
    queryOptions({
      queryKey: planKeys.list(),
      queryFn: async ({ signal }) => {
        const response = await plannerControllerFindPlansV1({ signal })

        return PlannerControllerFindPlansV1Response.parse(
          unwrapResponse(response, 200)
        )
      },
      staleTime: 30_000,
    }),
  detail: (planId: string) =>
    queryOptions({
      queryKey: planKeys.detail(planId),
      queryFn: async ({ signal }) => {
        const response = await plannerControllerFindPlanV1(planId, { signal })

        return PlannerControllerFindPlanV1Response.parse(
          unwrapResponse(response, 200)
        )
      },
      staleTime: 30_000,
    }),
  overview: (planId: string) =>
    queryOptions({
      queryKey: [...planKeys.detail(planId), "overview"] as const,
      queryFn: async ({ signal }) => {
        const response = await plannerControllerFindPlanV1(planId, { signal })
        const plan = PlannerControllerFindPlanV1Response.parse(
          unwrapResponse(response, 200)
        )

        return mapPlanDetailToOverview(plan)
      },
      staleTime: 30_000,
    }),
  accounts: (planId: string) =>
    queryOptions({
      queryKey: planKeys.accounts(planId),
      queryFn: async ({ signal }) => {
        const response = await plannerControllerFindAccountsV1(planId, {
          signal,
        })

        return PlannerControllerFindAccountsV1Response.parse(
          unwrapResponse(response, 200)
        )
      },
      staleTime: 30_000,
    }),
  incomeSchedule: (planId: string) =>
    queryOptions({
      queryKey: planKeys.incomeSchedule(planId),
      queryFn: async ({ signal }) => {
        const response = await plannerControllerFindIncomeScheduleV1(planId, {
          signal,
        })

        return PlannerControllerFindIncomeScheduleV1Response.parse(
          unwrapResponse(response, 200)
        )
      },
      staleTime: 30_000,
    }),
  incomePayments: (planId: string) =>
    queryOptions({
      queryKey: planKeys.incomePayments(planId),
      queryFn: async ({ signal }) => {
        const response = await plannerControllerFindIncomePaymentsV1(planId, {
          signal,
        })

        return PlannerControllerFindIncomePaymentsV1Response.parse(
          unwrapResponse(response, 200)
        )
      },
      staleTime: 30_000,
    }),
  paymentPeriods: (planId: string) =>
    queryOptions({
      queryKey: planKeys.paymentPeriods(planId),
      queryFn: async ({ signal }) => {
        const response = await plannerControllerFindPaymentPeriodsV1(planId, {
          signal,
        })

        return PlannerControllerFindPaymentPeriodsV1Response.parse(
          unwrapResponse(response, 200)
        )
      },
      staleTime: 30_000,
    }),
  paymentPeriod: (periodId: string) =>
    queryOptions({
      queryKey: planKeys.paymentPeriod(periodId),
      queryFn: async ({ signal }) => {
        const response = await plannerControllerFindPaymentPeriodV1(periodId, {
          signal,
        })

        return PlannerControllerFindPaymentPeriodV1Response.parse(
          unwrapResponse(response, 200)
        )
      },
      staleTime: 30_000,
    }),
  paymentPeriodItems: (periodId: string) =>
    queryOptions({
      queryKey: planKeys.paymentPeriodItems(periodId),
      queryFn: async ({ signal }) => {
        const response = await plannerControllerFindPaymentPeriodItemsV1(
          periodId,
          {
            signal,
          }
        )

        return PlannerControllerFindPaymentPeriodItemsV1Response.parse(
          unwrapResponse(response, 200)
        )
      },
      staleTime: 30_000,
    }),
  recurringExpenses: (planId: string) =>
    queryOptions({
      queryKey: planKeys.recurringExpenses(planId),
      queryFn: async ({ signal }) => {
        const response = await plannerControllerFindRecurringExpensesV1(
          planId,
          {
            signal,
          }
        )

        return PlannerControllerFindRecurringExpensesV1Response.parse(
          unwrapResponse(response, 200)
        )
      },
      staleTime: 30_000,
    }),
}
