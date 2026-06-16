import { queryOptions } from "@tanstack/react-query"

import { apiBaseUrl } from "@/api/env"
import {
  plannerControllerFindAccountsV1,
  plannerControllerFindCategoriesV1,
  plannerControllerFindCompletedItemsV1,
  plannerControllerFindIncomePaymentsSummaryV1,
  plannerControllerFindIncomePaymentsV1,
  plannerControllerFindIncomeScheduleV1,
  plannerControllerFindPaymentPeriodItemsV1,
  plannerControllerFindPaymentPeriodsV1,
  plannerControllerFindPaymentPeriodV1,
  plannerControllerFindPlanOverviewV1,
  plannerControllerFindPlansV1,
  plannerControllerFindPlanV1,
  plannerControllerFindRecurringExpensesV1,
} from "@/api/generated/endpoints/plans/plans"
import {
  PlannerControllerFindAccountsV1Response,
  PlannerControllerFindCategoriesV1Response,
  PlannerControllerFindCompletedItemsV1Response,
  PlannerControllerFindIncomePaymentsSummaryV1Response,
  PlannerControllerFindIncomePaymentsV1Response,
  PlannerControllerFindIncomeScheduleV1Response,
  PlannerControllerFindPaymentPeriodItemsV1Response,
  PlannerControllerFindPaymentPeriodsV1Response,
  PlannerControllerFindPaymentPeriodV1Response,
  PlannerControllerFindPlanOverviewV1Response,
  PlannerControllerFindPlansV1Response,
  PlannerControllerFindPlanV1Response,
  PlannerControllerFindRecurringExpensesV1Response,
} from "@/api/generated/endpoints/plans/plans.zod"
import type {
  FinancialPlanResponseDtoStatus,
  PaymentPeriodItemResponseDto,
  RecurringExpenseResponseDto,
} from "@/api/generated/model"
import { unwrapResponse } from "@/api/response"

import { planKeys } from "./plan.keys"

type PlanEditFormResponse = {
  currency: string
  endDate: string | null
  id: string
  metadataId: string
  name: string
  objective: string | null
  schemaVersion: string
  startDate: string
  status: FinancialPlanResponseDtoStatus
}

type IncomePaymentRefResponse = {
  amount: number
  currency: string
  date: string
  id: string
  month: string
  paymentNumberInMonth: number
  source: string
  status: string
  accountId: string | null
  accountName: string | null
}

type IncomePaymentDetailResponse = {
  amount: number
  currency: string
  date: string
  externalId: string | null
  id: string
  month: string
  paymentNumberInMonth: number
  source: string
  status: string
  accountId: string | null
  accountName: string | null
}

type PaymentPeriodItemDetailResponse = PaymentPeriodItemResponseDto

type RecurringExpenseListResponse = {
  account: string | null
  amount: number
  category: string | null
  concept: string
  day: number | null
  days: Array<{ id: string; day: number }>
  frequency: string
  fundingAccount: string | null
  id: string
}

async function fetchPlanJson<T>(path: string, signal?: AbortSignal) {
  const response = await fetch(`${apiBaseUrl}/api/v1${path}`, { signal })
  const payload = await response.json().catch(() => null)
  if (!response.ok) {
    throw new Error(
      payload?.error?.message ?? `Unexpected API status ${response.status}`
    )
  }
  return payload as T
}

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
  editForm: (planId: string) =>
    queryOptions({
      queryKey: planKeys.editForm(planId),
      queryFn: async ({ signal }) =>
        fetchPlanJson<PlanEditFormResponse>(
          `/plans/${planId}/edit-form`,
          signal
        ),
      staleTime: 30_000,
    }),
  overview: (planId: string) =>
    queryOptions({
      queryKey: planKeys.overview(planId),
      queryFn: async ({ signal }) => {
        const response = await plannerControllerFindPlanOverviewV1(planId, {
          signal,
        })

        return PlannerControllerFindPlanOverviewV1Response.parse(
          unwrapResponse(response, 200)
        )
      },
      staleTime: 30_000,
    }),
  incomePaymentRefs: (planId: string) =>
    queryOptions({
      queryKey: planKeys.incomePaymentRefs(planId),
      queryFn: async ({ signal }) =>
        fetchPlanJson<IncomePaymentRefResponse[]>(
          `/plans/${planId}/income-payments/refs`,
          signal
        ),
      staleTime: 30_000,
    }),
  incomePayment: (planId: string, incomePaymentId: string) =>
    queryOptions({
      queryKey: planKeys.incomePayment(planId, incomePaymentId),
      queryFn: async ({ signal }) =>
        fetchPlanJson<IncomePaymentDetailResponse>(
          `/plans/${planId}/income-payments/${incomePaymentId}`,
          signal
        ),
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
  incomePaymentsSummary: (planId: string) =>
    queryOptions({
      queryKey: planKeys.incomePaymentsSummary(planId),
      queryFn: async ({ signal }) => {
        const response = await plannerControllerFindIncomePaymentsSummaryV1(
          planId,
          {
            signal,
          }
        )

        return PlannerControllerFindIncomePaymentsSummaryV1Response.parse(
          unwrapResponse(response, 200)
        )
      },
      staleTime: 30_000,
    }),
  categories: (planId: string) =>
    queryOptions({
      queryKey: planKeys.categories(planId),
      queryFn: async ({ signal }) => {
        const response = await plannerControllerFindCategoriesV1(planId, {
          signal,
        })

        return PlannerControllerFindCategoriesV1Response.parse(
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
  paymentPeriodItem: (itemId: string) =>
    queryOptions({
      queryKey: planKeys.paymentPeriodItem(itemId),
      queryFn: async ({ signal }) =>
        fetchPlanJson<PaymentPeriodItemDetailResponse>(
          `/plans/payment-period-items/${itemId}`,
          signal
        ),
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
  recurringExpenseList: (planId: string) =>
    queryOptions({
      queryKey: planKeys.recurringExpenseList(planId),
      queryFn: async ({ signal }) =>
        fetchPlanJson<RecurringExpenseListResponse[]>(
          `/plans/${planId}/recurring-expenses/list`,
          signal
        ),
      staleTime: 30_000,
    }),
  recurringExpense: (planId: string, recurringExpenseId: string) =>
    queryOptions({
      queryKey: planKeys.recurringExpense(planId, recurringExpenseId),
      queryFn: async ({ signal }) =>
        fetchPlanJson<RecurringExpenseResponseDto>(
          `/plans/${planId}/recurring-expenses/${recurringExpenseId}`,
          signal
        ),
      staleTime: 30_000,
    }),
  completedItems: (planId: string) =>
    queryOptions({
      queryKey: planKeys.completedItems(planId),
      queryFn: async ({ signal }) => {
        const response = await plannerControllerFindCompletedItemsV1(planId, {
          signal,
        })

        return PlannerControllerFindCompletedItemsV1Response.parse(
          unwrapResponse(response, 200)
        )
      },
      staleTime: 30_000,
    }),
}
