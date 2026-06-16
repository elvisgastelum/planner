/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return, @typescript-eslint/restrict-template-expressions */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { QueryRunner } from 'typeorm';

import {
  AccountEntity,
  AccountType,
  AllocationCategoryEntity,
  CompletedItemEntity,
  CurrentAccountBalanceEntity,
  CurrentDebtBalanceEntity,
  DebtProjectionBalanceEntity,
  DebtProjectionSnapshotEntity,
  FinancialPlanEntity,
  IncomeCadence,
  IncomeGenerationMethod,
  IncomePaymentEntity,
  IncomeScheduleAmountRuleEntity,
  IncomeScheduleEntity,
  IncomeSource,
  IncomeStatus,
  ItemStatus,
  PaymentPeriodEntity,
  PaymentPeriodItemEntity,
  PlanRuleEntity,
  PlanStatus,
  PreIncomeAllocationEntity,
  PreIncomeAllocationItemEntity,
  RecurringExpenseDayEntity,
  RecurringExpenseDayRule,
  RecurringExpenseEntity,
  RecurringFrequency,
  SummaryNoteEntity,
} from '../planner/entities';

type FinancialPlanJson = Record<string, any>;

export const DEFAULT_PLAN_FILE_PATH = join(
  process.cwd(),
  'src',
  'plan-financiero.json',
);

export async function seedPlanFinanciero(
  queryRunner: QueryRunner,
  filePath = DEFAULT_PLAN_FILE_PATH,
) {
  const data = await loadPlanFinancieroJson(filePath);
  const metadata = data.metadata ?? {};

  if (!metadata.id) throw new Error('Plan metadata.id is required');

  await deletePlanFinanciero(queryRunner, metadata.id);

  const planRepository = queryRunner.manager.getRepository(FinancialPlanEntity);
  const plan = await planRepository.save(
    planRepository.create({
      metadataId: metadata.id,
      schemaVersion: data.schema_version,
      name: metadata.name,
      currency: metadata.currency ?? 'MXN',
      startDate: metadata.start_date,
      endDate: metadata.end_date ?? null,
      status: (metadata.status as PlanStatus | undefined) ?? PlanStatus.Active,
      objective: metadata.objective ?? null,
      projectedDebtFreeDate: data.summary?.projected_debt_free_date ?? null,
      projectedEmergencyFund:
        data.summary?.projected_emergency_fund_by_2026_08_14 ?? null,
    }),
  );

  await seedAllocationCategories(queryRunner, plan, data.allocation ?? {});
  await seedPlanRules(queryRunner, plan, data.rules ?? {});
  await seedAccounts(queryRunner, plan, data.accounts ?? []);
  await seedCurrentState(queryRunner, plan, data.current_state ?? {});
  await seedCompletedItems(queryRunner, plan, data.completed_items ?? []);
  await seedPreIncomeAllocation(queryRunner, plan, data.pre_income_allocation);
  await seedRecurringExpenses(queryRunner, plan, data.recurring_expenses ?? []);
  const incomePaymentsByExternalId = await seedIncomeProjection(
    queryRunner,
    plan,
    data.income_projection,
    data.rules?.income_schedule,
    data.payment_periods ?? [],
  );
  await seedPaymentPeriods(
    queryRunner,
    plan,
    data.payment_periods ?? [],
    incomePaymentsByExternalId,
  );
  await seedDebtProjection(queryRunner, plan, data.debt_projection ?? []);
  await seedSummaryNotes(queryRunner, plan, data.summary?.notes ?? []);

  return plan;
}

export async function deletePlanFinanciero(
  queryRunner: QueryRunner,
  metadataId: string,
) {
  await queryRunner.manager
    .getRepository(FinancialPlanEntity)
    .delete({ metadataId });
}

export function filterIncomePayments(
  payments: any[],
  periods: any[],
  planEndDate?: string | null,
) {
  const allowedPaymentIds = new Set(
    periods
      .map((period) => period?.income?.id)
      .filter((paymentId): paymentId is string => Boolean(paymentId)),
  );

  return payments.filter((payment) => {
    if (planEndDate && payment?.date && payment.date > planEndDate) {
      return false;
    }

    if (allowedPaymentIds.size > 0) {
      return allowedPaymentIds.has(payment?.id);
    }

    return true;
  });
}

export function resolveGeneratedThrough(
  projection: any,
  filteredPayments: any[],
  planEndDate?: string | null,
) {
  const generatedThrough = projection?.generated_through ?? null;
  const paymentDates = filteredPayments
    .map((payment) => payment?.date)
    .filter((date): date is string => Boolean(date))
    .sort();

  const latestSeededPaymentDate = paymentDates.at(-1) ?? null;

  if (!generatedThrough) return latestSeededPaymentDate ?? planEndDate ?? null;
  if (!planEndDate) return latestSeededPaymentDate ?? generatedThrough;
  if (generatedThrough > planEndDate)
    return latestSeededPaymentDate ?? planEndDate;

  return latestSeededPaymentDate ?? generatedThrough;
}

async function loadPlanFinancieroJson(filePath: string) {
  return JSON.parse(await readFile(filePath, 'utf8')) as FinancialPlanJson;
}

async function seedAllocationCategories(
  queryRunner: QueryRunner,
  plan: FinancialPlanEntity,
  allocation: Record<string, any>,
) {
  const repository = queryRunner.manager.getRepository(
    AllocationCategoryEntity,
  );
  await repository.save(
    Object.entries(allocation).map(([key, value]) =>
      repository.create({
        plan,
        key,
        name: key,
        percentage: Number(value?.percentage ?? 0),
        description: value?.description ?? null,
      }),
    ),
  );
}

async function seedPlanRules(
  queryRunner: QueryRunner,
  plan: FinancialPlanEntity,
  rules: Record<string, unknown>,
) {
  const repository = queryRunner.manager.getRepository(PlanRuleEntity);
  await repository.save(
    Object.entries(rules).map(([key, valueJson]) =>
      repository.create({
        plan,
        key,
        valueJson,
      }),
    ),
  );
}

async function seedAccounts(
  queryRunner: QueryRunner,
  plan: FinancialPlanEntity,
  accounts: any[],
) {
  const repository = queryRunner.manager.getRepository(AccountEntity);
  await repository.save(
    accounts.map((account) =>
      repository.create({
        plan,
        externalId: account.id,
        name: account.name,
        type: account.type as AccountType,
        balance: account.balance ?? 0,
        currency: account.currency ?? plan.currency,
      }),
    ),
  );
}

async function seedCurrentState(
  queryRunner: QueryRunner,
  plan: FinancialPlanEntity,
  currentState: any,
) {
  const asOf = currentState.as_of ?? plan.startDate;
  const accountRepo = queryRunner.manager.getRepository(
    CurrentAccountBalanceEntity,
  );
  const debtRepo = queryRunner.manager.getRepository(CurrentDebtBalanceEntity);

  await accountRepo.save(
    Object.entries(currentState.cash_available ?? {}).map(
      ([accountName, amount]) =>
        accountRepo.create({
          plan,
          asOf,
          accountName,
          amount: Number(amount),
          currency: plan.currency,
        }),
    ),
  );

  await debtRepo.save(
    Object.entries(currentState.debts ?? {}).map(([debtName, amount]) =>
      debtRepo.create({
        plan,
        asOf,
        debtName,
        amount: Number(amount),
        currency: plan.currency,
      }),
    ),
  );

  // Also update AccountEntity balances from cash_available (backward compatibility)
  const accRepo = queryRunner.manager.getRepository(AccountEntity);
  for (const [accountName, amount] of Object.entries(
    currentState.cash_available ?? {},
  )) {
    const existingAccount = await accRepo.findOne({
      where: { plan: { id: plan.id }, name: accountName },
    });
    if (existingAccount && existingAccount.balance === 0) {
      existingAccount.balance = Number(amount);
      await accRepo.save(existingAccount);
    }
  }
}

async function seedCompletedItems(
  queryRunner: QueryRunner,
  plan: FinancialPlanEntity,
  items: any[],
) {
  const repository = queryRunner.manager.getRepository(CompletedItemEntity);
  await repository.save(
    items.map((item) =>
      repository.create({
        plan,
        externalId: item.id,
        date: item.date,
        concept: item.concept,
        amount: Number(item.amount),
        type: item.type ?? null,
        category: item.category ?? null,
        fromAccount: item.from_account ?? null,
        toAccount: item.to_account ?? null,
        account: item.account ?? null,
        status: (item.status as ItemStatus | undefined) ?? ItemStatus.Completed,
      }),
    ),
  );
}

async function seedPreIncomeAllocation(
  queryRunner: QueryRunner,
  plan: FinancialPlanEntity,
  allocation?: any,
) {
  if (!allocation) return;

  const allocationRepo = queryRunner.manager.getRepository(
    PreIncomeAllocationEntity,
  );
  const itemRepo = queryRunner.manager.getRepository(
    PreIncomeAllocationItemEntity,
  );

  const entity = await allocationRepo.save(
    allocationRepo.create({
      plan,
      availableAmount: Number(allocation.available_amount),
      periodEnd: allocation.period_end,
    }),
  );

  await itemRepo.save(
    (allocation.items ?? []).map((item) =>
      itemRepo.create({
        preIncomeAllocation: entity,
        externalId: item.id,
        date: item.date,
        concept: item.concept,
        amount: Number(item.amount),
        category: item.category ?? null,
        account: item.account ?? null,
        status: (item.status as ItemStatus | undefined) ?? ItemStatus.Pending,
        nonRollover: item.non_rollover ?? false,
      }),
    ),
  );
}

async function seedRecurringExpenses(
  queryRunner: QueryRunner,
  plan: FinancialPlanEntity,
  expenses: any[],
) {
  const expenseRepo = queryRunner.manager.getRepository(RecurringExpenseEntity);
  const dayRepo = queryRunner.manager.getRepository(RecurringExpenseDayEntity);

  for (const expense of expenses) {
    const entity = await expenseRepo.save(
      expenseRepo.create({
        plan,
        concept: expense.concept,
        amount: Number(expense.amount),
        frequency: expense.frequency as RecurringFrequency,
        day: expense.day ?? null,
        date: expense.date ?? null,
        dayRule: (expense.day_rule as RecurringExpenseDayRule | null) ?? null,
        account: expense.account ?? null,
        fundingAccount: expense.funding_account ?? null,
        category: expense.category ?? null,
        nonRollover: expense.non_rollover ?? false,
        lastPaymentDate: expense.last_payment?.date ?? null,
        lastPaymentAmount: expense.last_payment?.amount ?? null,
      }),
    );

    if (expense.days?.length) {
      await dayRepo.save(
        expense.days.map((day: number) =>
          dayRepo.create({ recurringExpense: entity, day }),
        ),
      );
    }
  }
}

async function seedIncomeProjection(
  queryRunner: QueryRunner,
  plan: FinancialPlanEntity,
  projection: any,
  scheduleRule: any,
  periods: any[],
) {
  const paymentRepo = queryRunner.manager.getRepository(IncomePaymentEntity);
  const scheduleRepo = queryRunner.manager.getRepository(IncomeScheduleEntity);
  const amountRuleRepo = queryRunner.manager.getRepository(
    IncomeScheduleAmountRuleEntity,
  );

  const filteredPayments = filterIncomePayments(
    projection?.payments ?? [],
    periods,
    plan.endDate,
  );
  const generatedThrough = resolveGeneratedThrough(
    projection,
    filteredPayments,
    plan.endDate,
  );

  let schedule: IncomeScheduleEntity | null = null;
  if (scheduleRule) {
    schedule = await scheduleRepo.save(
      scheduleRepo.create({
        plan,
        cadence: scheduleRule.cadence as IncomeCadence,
        anchorPaymentDate: scheduleRule.anchor_payment_date,
        currency: scheduleRule.currency ?? plan.currency,
        ordinaryMonthGrossIncome:
          scheduleRule.ordinary_month_gross_income ?? null,
        ordinaryMonthNetReference:
          scheduleRule.ordinary_month_net_reference ?? null,
        generatedThrough,
        generationMethod:
          (projection?.generation_method as IncomeGenerationMethod | null) ??
          null,
        calculationRule: scheduleRule.calculation_rule ?? null,
      }),
    );

    const incomeSchedule = schedule;

    await amountRuleRepo.save(
      Object.entries(scheduleRule.monthly_payment_amounts ?? {}).map(
        ([key, amount]) =>
          amountRuleRepo.create({
            incomeSchedule,
            paymentNumberInMonth: Number(key.replace('payment_', '')),
            amount: Number(amount),
            currency: incomeSchedule.currency,
          }),
      ),
    );
  }

  const savedPayments = await paymentRepo.save(
    filteredPayments.map((payment) =>
      paymentRepo.create({
        plan,
        incomeSchedule: schedule ?? undefined,
        externalId: payment.id,
        date: payment.date,
        month: payment.month,
        paymentNumberInMonth: payment.payment_number_in_month,
        amount: Number(payment.amount),
        currency: payment.currency ?? plan.currency,
        status:
          (payment.status as IncomeStatus | undefined) ??
          IncomeStatus.Projected,
        source: IncomeSource.Imported,
      }),
    ),
  );

  return new Map(
    savedPayments
      .filter((payment) => payment.externalId)
      .map((payment) => [payment.externalId as string, payment] as const),
  );
}

async function seedPaymentPeriods(
  queryRunner: QueryRunner,
  plan: FinancialPlanEntity,
  periods: any[],
  paymentsByExternalId?: Map<string, IncomePaymentEntity>,
) {
  const periodRepo = queryRunner.manager.getRepository(PaymentPeriodEntity);
  const itemRepo = queryRunner.manager.getRepository(PaymentPeriodItemEntity);

  const effectivePaymentsByExternalId =
    paymentsByExternalId ?? new Map<string, IncomePaymentEntity>();

  for (const period of periods) {
    const incomePayment = period.income?.id
      ? (effectivePaymentsByExternalId.get(period.income.id) ?? null)
      : null;

    if (period.income?.id && !incomePayment) {
      throw new Error(
        `Payment period ${period.id} references missing income payment ${period.income.id}`,
      );
    }

    const entity = await periodRepo.save(
      periodRepo.create({
        plan,
        incomePayment,
        externalId: period.id,
        incomeDate: period.income_date,
        plannedTotal: Number(period.planned_total ?? 0),
        plannedRemaining: Number(period.planned_remaining ?? 0),
      }),
    );

    const seededItems = (period.items ?? []).filter((item) =>
      plan.endDate ? item.date <= plan.endDate : true,
    );

    const savedItems = await itemRepo.save(
      seededItems.map((item) =>
        itemRepo.create({
          paymentPeriod: entity,
          externalId: item.id,
          date: item.date,
          concept: item.concept,
          plannedAmount: Number(item.planned_amount),
          actualAmount: item.actual_amount ?? null,
          category: item.category ?? null,
          account: item.account ?? null,
          fundingAccount: item.funding_account ?? null,
          status: (item.status as ItemStatus | undefined) ?? ItemStatus.Pending,
          completedAt: item.completed_at ? new Date(item.completed_at) : null,
          notes: item.notes ?? null,
          nonRollover: item.non_rollover ?? false,
          treatedAsSpentIfUnused: item.treated_as_spent_if_unused ?? false,
        }),
      ),
    );

    const plannedTotal = roundMoney(
      savedItems.reduce((sum, item) => sum + Number(item.plannedAmount), 0),
    );
    const paymentAmount = Number(
      incomePayment?.amount ?? period.income?.amount ?? 0,
    );

    await periodRepo.update(entity.id, {
      plannedTotal,
      plannedRemaining: roundMoney(paymentAmount - plannedTotal),
    });
  }
}

async function seedDebtProjection(
  queryRunner: QueryRunner,
  plan: FinancialPlanEntity,
  snapshots: any[],
) {
  const snapshotRepo = queryRunner.manager.getRepository(
    DebtProjectionSnapshotEntity,
  );
  const balanceRepo = queryRunner.manager.getRepository(
    DebtProjectionBalanceEntity,
  );

  for (const snapshot of snapshots) {
    const { date, ...balances } = snapshot;
    const entity = await snapshotRepo.save(snapshotRepo.create({ plan, date }));

    await balanceRepo.save(
      Object.entries(balances).map(([accountName, amount]) =>
        balanceRepo.create({
          snapshot: entity,
          accountName,
          amount: Number(amount),
        }),
      ),
    );
  }
}

async function seedSummaryNotes(
  queryRunner: QueryRunner,
  plan: FinancialPlanEntity,
  notes: string[],
) {
  const repository = queryRunner.manager.getRepository(SummaryNoteEntity);
  await repository.save(notes.map((note) => repository.create({ plan, note })));
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}
