import { mutationOptions } from "@tanstack/react-query"

import {
  plannerControllerArchiveCategoryV1,
  plannerControllerCreateAccountV1,
  plannerControllerCreateBudgetItemV1,
  plannerControllerCreateBudgetPeriodV1,
  plannerControllerCreateCategoryV1,
  plannerControllerCreateIncomePaymentV1,
  plannerControllerCreateIncomeSourceV1,
  plannerControllerCreatePlanV1,
  plannerControllerCreateRecurringItemV1,
  plannerControllerDeletePlanV1,
  plannerControllerRestoreCategoryV1,
  plannerControllerUpdateAccountV1,
  plannerControllerUpdateCategoryV1,
  plannerControllerUpdatePlanV1,
} from "@/api/generated/endpoints/plans/plans"
import type {
  CreateAccountDto,
  CreateBudgetItemDto,
  CreateBudgetPeriodDto,
  CreateCategoryDto,
  CreateIncomePaymentDto,
  CreateIncomeSourceDto,
  CreatePlanDto,
  CreateRecurringItemDto,
  UpdateAccountDto,
  UpdateCategoryDto,
  UpdatePlanDto,
} from "@/api/generated/model"
import { queryClient } from "@/api/query-client"
import { unwrapResponse } from "@/api/response"

import { planKeys } from "./plan.keys"

function invalidatePlan(planId: string) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: planKeys.list() }),
    queryClient.invalidateQueries({ queryKey: planKeys.detail(planId) }),
    queryClient.invalidateQueries({ queryKey: planKeys.dashboard(planId) }),
  ])
}

function invalidatePlanResource(planId: string, queryKey: readonly unknown[]) {
  return Promise.all([
    invalidatePlan(planId),
    queryClient.invalidateQueries({ queryKey }),
  ])
}

export const planMutations = {
  create: () =>
    mutationOptions({
      mutationFn: async (data: CreatePlanDto) =>
        unwrapResponse(await plannerControllerCreatePlanV1(data), 201),
      onSuccess: async () => {
        await queryClient.invalidateQueries({ queryKey: planKeys.list() })
      },
    }),
  update: () =>
    mutationOptions({
      mutationFn: async (variables: {
        planId: string
        data: UpdatePlanDto
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
            variables.planId,
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
      mutationFn: async () => {
        throw new Error("Account deletion is not available; archive instead.")
      },
      onSuccess: async () => {
        await Promise.resolve()
      },
    }),
  createCategory: () =>
    mutationOptions({
      mutationFn: async (variables: {
        planId: string
        data: CreateCategoryDto
      }) =>
        unwrapResponse(
          await plannerControllerCreateCategoryV1(
            variables.planId,
            variables.data
          ),
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
        data: UpdateCategoryDto
      }) =>
        unwrapResponse(
          await plannerControllerUpdateCategoryV1(
            variables.planId,
            variables.categoryId,
            variables.data
          ),
          200
        ),
      onSuccess: async (_, variables) => {
        await queryClient.invalidateQueries({
          queryKey: planKeys.categories(variables.planId),
        })
      },
    }),
  archiveCategory: () =>
    mutationOptions({
      mutationFn: async (variables: {
        categoryId: string
        planId: string
      }) =>
        unwrapResponse(
          await plannerControllerArchiveCategoryV1(
            variables.planId,
            variables.categoryId
          ),
          200
        ),
      onSuccess: async (_, variables) => {
        await queryClient.invalidateQueries({
          queryKey: planKeys.categories(variables.planId),
        })
      },
    }),
  restoreCategory: () =>
    mutationOptions({
      mutationFn: async (variables: {
        categoryId: string
        planId: string
      }) =>
        unwrapResponse(
          await plannerControllerRestoreCategoryV1(
            variables.planId,
            variables.categoryId
          ),
          200
        ),
      onSuccess: async (_, variables) => {
        await queryClient.invalidateQueries({
          queryKey: planKeys.categories(variables.planId),
        })
      },
    }),
  createIncomeSource: () =>
    mutationOptions({
      mutationFn: async (variables: {
        planId: string
        data: CreateIncomeSourceDto
      }) =>
        unwrapResponse(
          await plannerControllerCreateIncomeSourceV1(
            variables.planId,
            variables.data
          ),
          201
        ),
      onSuccess: async (_, variables) => {
        await invalidatePlanResource(
          variables.planId,
          planKeys.incomeSources(variables.planId)
        )
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
      },
    }),
  createBudgetPeriod: () =>
    mutationOptions({
      mutationFn: async (variables: {
        planId: string
        data: CreateBudgetPeriodDto
      }) =>
        unwrapResponse(
          await plannerControllerCreateBudgetPeriodV1(
            variables.planId,
            variables.data
          ),
          201
        ),
      onSuccess: async (_, variables) => {
        await invalidatePlanResource(
          variables.planId,
          planKeys.budgetPeriods(variables.planId)
        )
      },
    }),
  createBudgetItem: () =>
    mutationOptions({
      mutationFn: async (variables: {
        planId: string
        periodId: string
        data: CreateBudgetItemDto
      }) =>
        unwrapResponse(
          await plannerControllerCreateBudgetItemV1(
            variables.planId,
            variables.periodId,
            variables.data
          ),
          201
        ),
      onSuccess: async (_, variables) => {
        await invalidatePlanResource(
          variables.planId,
          planKeys.budgetItems(variables.planId, variables.periodId)
        )
      },
    }),
  createRecurringItem: () =>
    mutationOptions({
      mutationFn: async (variables: {
        planId: string
        data: CreateRecurringItemDto
      }) =>
        unwrapResponse(
          await plannerControllerCreateRecurringItemV1(
            variables.planId,
            variables.data
          ),
          201
        ),
      onSuccess: async (_, variables) => {
        await invalidatePlanResource(
          variables.planId,
          planKeys.recurringItems(variables.planId)
        )
      },
    }),
}
