import { mutationOptions } from "@tanstack/react-query"

import { apiBaseUrl } from "@/api/env"
import {
  plannerControllerCompletePaymentPeriodItemV1,
  plannerControllerCreateAccountV1,
  plannerControllerCreateIncomePaymentV1,
  plannerControllerCreateIncomeScheduleV1,
  plannerControllerCreatePaymentPeriodItemV1,
  plannerControllerCreatePaymentPeriodV1,
  plannerControllerCreatePlanV1,
  plannerControllerCreateRecurringExpenseV1,
  plannerControllerDeleteAccountV1,
  plannerControllerDeleteIncomePaymentV1,
  plannerControllerDeleteIncomeScheduleV1,
  plannerControllerDeletePaymentPeriodItemV1,
  plannerControllerDeletePaymentPeriodV1,
  plannerControllerDeletePlanV1,
  plannerControllerDeleteRecurringExpenseV1,
  plannerControllerGenerateIncomePaymentsV1,
  plannerControllerImportJsonV1,
  plannerControllerUpdateAccountV1,
  plannerControllerUpdateIncomePaymentStatusV1,
  plannerControllerUpdateIncomePaymentV1,
  plannerControllerUpdateIncomeScheduleV1,
  plannerControllerUpdatePaymentPeriodItemV1,
  plannerControllerUpdatePaymentPeriodV1,
  plannerControllerUpdatePlanV1,
  plannerControllerUpdateRecurringExpenseV1,
} from "@/api/generated/endpoints/plans/plans"
import type {
  CompletePaymentPeriodItemDto,
  CreateAccountDto,
  CreateAllocationCategoryDto,
  CreateFinancialPlanDto,
  CreateIncomePaymentDto,
  CreateIncomeScheduleDto,
  CreatePaymentPeriodDto,
  CreatePaymentPeriodItemDto,
  CreateRecurringExpenseDto,
  ImportPlanJsonDto,
  UpdateAccountDto,
  UpdateAllocationCategoryDto,
  UpdateFinancialPlanDto,
  UpdateIncomePaymentDto,
  UpdateIncomePaymentStatusDto,
  UpdateIncomePaymentStatusDtoStatus,
  UpdateIncomeScheduleDto,
  UpdatePaymentPeriodDto,
  UpdatePaymentPeriodItemDto,
  UpdateRecurringExpenseDto,
} from "@/api/generated/model"
import { queryClient } from "@/api/query-client"
import { unwrapResponse } from "@/api/response"
import { CORRELATION_HEADER } from "@/lib/logging/correlation"
import { debugTrace } from "@/lib/logging/logger"

import { planKeys } from "./plan.keys"

function invalidatePlan(planId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: planKeys.list() }),
    queryClient.invalidateQueries({ queryKey: planKeys.detail(planId) }),
    queryClient.invalidateQueries({ queryKey: planKeys.overview(planId) }),
  ])
}

function invalidatePlanResource(planId: string, queryKey: readonly unknown[]) {
  return Promise.all([
    invalidatePlan(planId),
    queryClient.invalidateQueries({ queryKey }),
  ])
}

function invalidatePaymentPeriod(planId: string, periodId: string) {
  return Promise.all([
    invalidatePlanResource(planId, planKeys.paymentPeriods(planId)),
    queryClient.invalidateQueries({
      queryKey: planKeys.paymentPeriod(periodId),
    }),
    queryClient.invalidateQueries({
      queryKey: planKeys.paymentPeriodItems(periodId),
    }),
  ])
}

async function requestPlanJson<TData>(
  url: string,
  init: RequestInit,
  expectedStatus: number
): Promise<{ data: TData; status: number; headers: Headers }> {
  const response = await fetch(url, {
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  })
  const body = [204, 205, 304].includes(response.status)
    ? null
    : await response.text()
  const data = body ? JSON.parse(body) : {}

  if (response.status !== expectedStatus) {
    throw new Error(
      (data as { error?: { message?: string } })?.error?.message ??
        `Unexpected API status ${response.status}`
    )
  }

  debugTrace("PLAN MUTATION RESPONSE READY", {
    requestId: response.headers.get(CORRELATION_HEADER) ?? undefined,
    status: response.status,
    data,
  })

  return {
    data: data as TData,
    status: response.status,
    headers: response.headers,
  }
}

export const planMutations = {
  create: () =>
    mutationOptions({
      mutationFn: async (data: CreateFinancialPlanDto) =>
        unwrapResponse(await plannerControllerCreatePlanV1(data), 201),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: planKeys.list() })
      },
    }),
  importJson: () =>
    mutationOptions({
      mutationFn: async (data: ImportPlanJsonDto) =>
        unwrapResponse(await plannerControllerImportJsonV1(data), 201),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: planKeys.list() })
      },
    }),
  update: () =>
    mutationOptions({
      mutationFn: async (variables: {
        planId: string
        data: UpdateFinancialPlanDto
      }) =>
        unwrapResponse(
          await plannerControllerUpdatePlanV1(variables.planId, variables.data),
          200
        ),
      onSuccess: async (plan) => {
        await invalidatePlan(plan.id)
      },
    }),
  delete: () =>
    mutationOptions({
      mutationFn: async (planId: string) =>
        unwrapResponse(await plannerControllerDeletePlanV1(planId), 200),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: planKeys.list() })
      },
    }),
  createAccount: () =>
    mutationOptions({
      mutationFn: async (variables: {
        planId: string
        data: CreateAccountDto
      }) =>
        unwrapResponse(
          await plannerControllerCreateAccountV1(
            variables.planId,
            variables.data
          ),
          201
        ),
      onSuccess: async (_, variables) => {
        await invalidatePlanResource(
          variables.planId,
          planKeys.accounts(variables.planId)
        )
      },
    }),
  updateAccount: () =>
    mutationOptions({
      mutationFn: async (variables: {
        accountId: string
        planId: string
        data: UpdateAccountDto
      }) =>
        unwrapResponse(
          await plannerControllerUpdateAccountV1(
            variables.accountId,
            variables.data
          ),
          200
        ),
      onSuccess: async (_, variables) => {
        await invalidatePlanResource(
          variables.planId,
          planKeys.accounts(variables.planId)
        )
      },
    }),
  deleteAccount: () =>
    mutationOptions({
      mutationFn: async (variables: { accountId: string; planId: string }) =>
        unwrapResponse(
          await plannerControllerDeleteAccountV1(variables.accountId),
          200
        ),
      onSuccess: async (_, variables) => {
        await invalidatePlanResource(
          variables.planId,
          planKeys.accounts(variables.planId)
        )
      },
    }),
  createCategory: () =>
    mutationOptions({
      mutationFn: async (variables: {
        planId: string
        data: CreateAllocationCategoryDto
      }) =>
        requestPlanJson(
          `${apiBaseUrl}/api/v1/plans/${variables.planId}/categories`,
          {
            method: "POST",
            body: JSON.stringify(variables.data),
          },
          201
        ),
      onSuccess: async (_, variables) => {
        await queryClient.invalidateQueries({
          queryKey: planKeys.categories(variables.planId),
        })
      },
    }),
  updateCategory: () =>
    mutationOptions({
      mutationFn: async (variables: {
        categoryId: string
        planId: string
        data: UpdateAllocationCategoryDto
      }) =>
        requestPlanJson(
          `${apiBaseUrl}/api/v1/plans/${variables.planId}/categories/${variables.categoryId}`,
          {
            method: "PATCH",
            body: JSON.stringify(variables.data),
          },
          200
        ),
      onSuccess: async (_, variables) => {
        await queryClient.invalidateQueries({
          queryKey: planKeys.categories(variables.planId),
        })
      },
    }),
  deleteCategory: () =>
    mutationOptions({
      mutationFn: async (variables: { categoryId: string; planId: string }) =>
        requestPlanJson(
          `${apiBaseUrl}/api/v1/plans/${variables.planId}/categories/${variables.categoryId}`,
          {
            method: "DELETE",
          },
          200
        ),
      onSuccess: async (_, variables) => {
        await queryClient.invalidateQueries({
          queryKey: planKeys.categories(variables.planId),
        })
      },
    }),
  createIncomeSchedule: () =>
    mutationOptions({
      mutationFn: async (variables: {
        planId: string
        data: CreateIncomeScheduleDto
      }) =>
        unwrapResponse(
          await plannerControllerCreateIncomeScheduleV1(
            variables.planId,
            variables.data
          ),
          201
        ),
      onSuccess: async (_, variables) => {
        await invalidatePlanResource(
          variables.planId,
          planKeys.incomeSchedule(variables.planId)
        )
      },
    }),
  updateIncomeSchedule: () =>
    mutationOptions({
      mutationFn: async (variables: {
        planId: string
        data: UpdateIncomeScheduleDto
      }) =>
        unwrapResponse(
          await plannerControllerUpdateIncomeScheduleV1(
            variables.planId,
            variables.data
          ),
          200
        ),
      onSuccess: async (_, variables) => {
        await invalidatePlanResource(
          variables.planId,
          planKeys.incomeSchedule(variables.planId)
        )
      },
    }),
  deleteIncomeSchedule: () =>
    mutationOptions({
      mutationFn: async (planId: string) =>
        unwrapResponse(
          await plannerControllerDeleteIncomeScheduleV1(planId),
          200
        ),
      onSuccess: async (_, planId) => {
        await invalidatePlanResource(planId, planKeys.incomeSchedule(planId))
      },
    }),
  generateIncomePayments: () =>
    mutationOptions({
      mutationFn: async (variables: {
        planId: string
        data: { through: string }
      }) =>
        unwrapResponse(
          await plannerControllerGenerateIncomePaymentsV1(
            variables.planId,
            variables.data
          ),
          201
        ),
      onSuccess: async (_, variables) => {
        await Promise.all([
          invalidatePlanResource(
            variables.planId,
            planKeys.incomePayments(variables.planId)
          ),
          queryClient.invalidateQueries({
            queryKey: planKeys.incomePaymentRefs(variables.planId),
          }),
          queryClient.invalidateQueries({
            queryKey: planKeys.incomeSchedule(variables.planId),
          }),
        ])
      },
    }),
  createIncomePayment: () =>
    mutationOptions({
      mutationFn: async (variables: {
        planId: string
        data: CreateIncomePaymentDto
      }) =>
        unwrapResponse(
          await plannerControllerCreateIncomePaymentV1(
            variables.planId,
            variables.data
          ),
          201
        ),
      onSuccess: async (_, variables) => {
        await invalidatePlanResource(
          variables.planId,
          planKeys.incomePayments(variables.planId)
        )
        await queryClient.invalidateQueries({
          queryKey: planKeys.incomePaymentRefs(variables.planId),
        })
      },
    }),
  updateIncomePayment: () =>
    mutationOptions({
      mutationFn: async (variables: {
        incomePaymentId: string
        planId: string
        data: UpdateIncomePaymentDto
      }) =>
        unwrapResponse(
          await plannerControllerUpdateIncomePaymentV1(
            variables.incomePaymentId,
            variables.data
          ),
          200
        ),
      onSuccess: async (_, variables) => {
        await invalidatePlanResource(
          variables.planId,
          planKeys.incomePayments(variables.planId)
        )
        await queryClient.invalidateQueries({
          queryKey: planKeys.incomePayment(
            variables.planId,
            variables.incomePaymentId
          ),
        })
        await queryClient.invalidateQueries({
          queryKey: planKeys.incomePaymentRefs(variables.planId),
        })
      },
    }),
  deleteIncomePayment: () =>
    mutationOptions({
      mutationFn: async (variables: {
        incomePaymentId: string
        planId: string
      }) =>
        unwrapResponse(
          await plannerControllerDeleteIncomePaymentV1(
            variables.incomePaymentId
          ),
          200
        ),
      onSuccess: async (_, variables) => {
        await invalidatePlanResource(
          variables.planId,
          planKeys.incomePayments(variables.planId)
        )
        await queryClient.invalidateQueries({
          queryKey: planKeys.incomePayment(
            variables.planId,
            variables.incomePaymentId
          ),
        })
        await queryClient.invalidateQueries({
          queryKey: planKeys.incomePaymentRefs(variables.planId),
        })
      },
    }),
  updateIncomePaymentStatus: () =>
    mutationOptions({
      mutationFn: async (variables: {
        incomePaymentId: string
        planId: string
        status: UpdateIncomePaymentStatusDtoStatus
      }) =>
        unwrapResponse(
          await plannerControllerUpdateIncomePaymentStatusV1(
            variables.incomePaymentId,
            { status: variables.status } as UpdateIncomePaymentStatusDto
          ),
          200
        ),
      onSuccess: async (_, variables) => {
        await Promise.all([
          queryClient.invalidateQueries({
            queryKey: planKeys.incomePayments(variables.planId),
          }),
          queryClient.invalidateQueries({
            queryKey: planKeys.incomePaymentRefs(variables.planId),
          }),
          queryClient.invalidateQueries({
            queryKey: planKeys.incomePaymentsSummary(variables.planId),
          }),
          queryClient.invalidateQueries({
            queryKey: planKeys.overview(variables.planId),
          }),
        ])
      },
    }),
  createPaymentPeriod: () =>
    mutationOptions({
      mutationFn: async (variables: {
        planId: string
        data: CreatePaymentPeriodDto
      }) =>
        unwrapResponse(
          await plannerControllerCreatePaymentPeriodV1(
            variables.planId,
            variables.data
          ),
          201
        ),
      onSuccess: async (_, variables) => {
        await invalidatePlanResource(
          variables.planId,
          planKeys.paymentPeriods(variables.planId)
        )
      },
    }),
  updatePaymentPeriod: () =>
    mutationOptions({
      mutationFn: async (variables: {
        periodId: string
        planId: string
        data: UpdatePaymentPeriodDto
      }) =>
        unwrapResponse(
          await plannerControllerUpdatePaymentPeriodV1(
            variables.periodId,
            variables.data
          ),
          200
        ),
      onSuccess: async (_, variables) => {
        await invalidatePaymentPeriod(variables.planId, variables.periodId)
      },
    }),
  deletePaymentPeriod: () =>
    mutationOptions({
      mutationFn: async (variables: { periodId: string; planId: string }) =>
        unwrapResponse(
          await plannerControllerDeletePaymentPeriodV1(variables.periodId),
          200
        ),
      onSuccess: async (_, variables) => {
        await invalidatePlanResource(
          variables.planId,
          planKeys.paymentPeriods(variables.planId)
        )
        await queryClient.invalidateQueries({
          queryKey: planKeys.paymentPeriod(variables.periodId),
        })
        await queryClient.invalidateQueries({
          queryKey: planKeys.paymentPeriodItems(variables.periodId),
        })
      },
    }),
  createPaymentPeriodItem: () =>
    mutationOptions({
      mutationFn: async (variables: {
        periodId: string
        planId: string
        data: CreatePaymentPeriodItemDto
      }) =>
        unwrapResponse(
          await plannerControllerCreatePaymentPeriodItemV1(
            variables.periodId,
            variables.data
          ),
          201
        ),
      onSuccess: async (_, variables) => {
        await invalidatePaymentPeriod(variables.planId, variables.periodId)
      },
    }),
  updatePaymentPeriodItem: () =>
    mutationOptions({
      mutationFn: async (variables: {
        itemId: string
        periodId: string
        planId: string
        data: UpdatePaymentPeriodItemDto
      }) =>
        unwrapResponse(
          await plannerControllerUpdatePaymentPeriodItemV1(
            variables.itemId,
            variables.data
          ),
          200
        ),
      onSuccess: async (_, variables) => {
        await invalidatePaymentPeriod(variables.planId, variables.periodId)
        await queryClient.invalidateQueries({
          queryKey: planKeys.paymentPeriodItem(variables.itemId),
        })
      },
    }),
  deletePaymentPeriodItem: () =>
    mutationOptions({
      mutationFn: async (variables: {
        itemId: string
        periodId: string
        planId: string
      }) =>
        unwrapResponse(
          await plannerControllerDeletePaymentPeriodItemV1(variables.itemId),
          200
        ),
      onSuccess: async (_, variables) => {
        await invalidatePaymentPeriod(variables.planId, variables.periodId)
        await queryClient.invalidateQueries({
          queryKey: planKeys.paymentPeriodItem(variables.itemId),
        })
      },
    }),
  completePaymentPeriodItem: () =>
    mutationOptions({
      mutationFn: async (variables: {
        itemId: string
        periodId: string
        planId: string
        data: CompletePaymentPeriodItemDto
      }) =>
        unwrapResponse(
          await plannerControllerCompletePaymentPeriodItemV1(
            variables.itemId,
            variables.data
          ),
          201
        ),
      onSuccess: async (_, variables) => {
        await invalidatePaymentPeriod(variables.planId, variables.periodId)
        await queryClient.invalidateQueries({
          queryKey: planKeys.paymentPeriodItem(variables.itemId),
        })
      },
    }),
  createRecurringExpense: () =>
    mutationOptions({
      mutationFn: async (variables: {
        planId: string
        data: CreateRecurringExpenseDto
      }) =>
        unwrapResponse(
          await plannerControllerCreateRecurringExpenseV1(
            variables.planId,
            variables.data
          ),
          201
        ),
      onSuccess: async (_, variables) => {
        await invalidatePlanResource(
          variables.planId,
          planKeys.recurringExpenses(variables.planId)
        )
        await queryClient.invalidateQueries({
          queryKey: planKeys.recurringExpenseList(variables.planId),
        })
      },
    }),
  updateRecurringExpense: () =>
    mutationOptions({
      mutationFn: async (variables: {
        recurringExpenseId: string
        planId: string
        data: UpdateRecurringExpenseDto
      }) =>
        unwrapResponse(
          await plannerControllerUpdateRecurringExpenseV1(
            variables.recurringExpenseId,
            variables.data
          ),
          200
        ),
      onSuccess: async (_, variables) => {
        await invalidatePlanResource(
          variables.planId,
          planKeys.recurringExpenses(variables.planId)
        )
        await queryClient.invalidateQueries({
          queryKey: planKeys.recurringExpenseList(variables.planId),
        })
        await queryClient.invalidateQueries({
          queryKey: planKeys.recurringExpense(
            variables.planId,
            variables.recurringExpenseId
          ),
        })
      },
    }),
  deleteRecurringExpense: () =>
    mutationOptions({
      mutationFn: async (variables: {
        recurringExpenseId: string
        planId: string
      }) =>
        unwrapResponse(
          await plannerControllerDeleteRecurringExpenseV1(
            variables.recurringExpenseId
          ),
          200
        ),
      onSuccess: async (_, variables) => {
        await invalidatePlanResource(
          variables.planId,
          planKeys.recurringExpenses(variables.planId)
        )
        await queryClient.invalidateQueries({
          queryKey: planKeys.recurringExpenseList(variables.planId),
        })
        await queryClient.invalidateQueries({
          queryKey: planKeys.recurringExpense(
            variables.planId,
            variables.recurringExpenseId
          ),
        })
      },
    }),
}
