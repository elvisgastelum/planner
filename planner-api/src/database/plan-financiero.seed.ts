import { readFile } from 'node:fs/promises';
import { join } from 'node:path';

import { QueryRunner } from 'typeorm';

import {
  AccountBalanceSnapshotEntity,
  AllocationCategoryEntity,
  BudgetItemEntity,
  BudgetItemStatus,
  BudgetItemTransactionEntity,
  BudgetPeriodEntity,
  BudgetPeriodStatus,
  BudgetPeriodType,
  DebtProjectionPointEntity,
  DebtProjectionRunEntity,
  FinancialAccountEntity,
  FinancialAccountStatus,
  FinancialAccountType,
  FinancialPlanEntity,
  IncomeCadence,
  IncomePaymentEntity,
  IncomePaymentStatus,
  IncomeScheduleAmountRuleEntity,
  IncomeScheduleEntity,
  IncomeSourceEntity,
  LiabilityTermsEntity,
  PlanSettingEntity,
  PlanStatus,
  RecurringItemEntity,
  RecurringItemType,
  RolloverPolicy,
  SnapshotSource,
  SummaryNoteEntity,
  TransactionEntity,
  TransactionEntryEntity,
  TransactionStatus,
  TransactionType,
} from '../planner/entities';

export const DEFAULT_PLAN_FILE_PATH = join(
  process.cwd(),
  'src',
  'plan-financiero.json',
);

/**
 * Simplified seed function that creates a basic plan with normalized entities.
 * This is a compilation-friendly version that creates minimal test data.
 */
export async function seedPlanFinanciero(
  queryRunner: QueryRunner,
  filePath = DEFAULT_PLAN_FILE_PATH,
): Promise<FinancialPlanEntity> {
  // Delete existing plan if present
  await deletePlanFinanciero(queryRunner, 'plan-financiero-personal');

  // Create plan
  const planRepo = queryRunner.manager.getRepository(FinancialPlanEntity);
  const plan = await planRepo.save(
    planRepo.create({
      metadataId: 'plan-financiero-personal',
      schemaVersion: '1.0.0',
      name: 'Plan Financiero Personal',
      baseCurrency: 'MXN',
      startDate: '2024-01-01',
      endDate: null,
      status: PlanStatus.Active,
      objective: 'Debt freedom by 2026',
      projectedDebtFreeDate: '2026-08-01',
      projectedEmergencyFundCents: 500000, // $5,000 MXN
    }),
  );

  // Create categories (total <= 10000 bps = 100%)
  const catRepo = queryRunner.manager.getRepository(AllocationCategoryEntity);
  const categories = await catRepo.save([
    catRepo.create({
      planId: plan.id,
      plan,
      code: 'needs',
      name: 'Needs',
      idealPercentageBps: 5000,
    }),
    catRepo.create({
      planId: plan.id,
      plan,
      code: 'wants',
      name: 'Wants',
      idealPercentageBps: 3000,
    }),
    catRepo.create({
      planId: plan.id,
      plan,
      code: 'savings',
      name: 'Savings',
      idealPercentageBps: 2000,
    }),
  ]);

  // Create accounts
  const acctRepo = queryRunner.manager.getRepository(FinancialAccountEntity);
  const checking = await acctRepo.save(
    acctRepo.create({
      planId: plan.id,
      plan,
      name: 'Checking',
      accountType: FinancialAccountType.Checking,
      currency: 'MXN',
      status: FinancialAccountStatus.Active,
    }),
  );

  const savings = await acctRepo.save(
    acctRepo.create({
      planId: plan.id,
      plan,
      name: 'Savings',
      accountType: FinancialAccountType.Savings,
      currency: 'MXN',
      status: FinancialAccountStatus.Active,
    }),
  );

  const creditCard = await acctRepo.save(
    acctRepo.create({
      planId: plan.id,
      plan,
      name: 'Credit Card',
      accountType: FinancialAccountType.CreditCard,
      currency: 'MXN',
      status: FinancialAccountStatus.Active,
    }),
  );

  // Create liability terms for credit card
  const termsRepo = queryRunner.manager.getRepository(LiabilityTermsEntity);
  await termsRepo.save(
    termsRepo.create({
      accountId: creditCard.id,
      account: creditCard,
      creditLimitCents: 5000000, // $50,000 MXN
      aprBps: 3500, // 35% APR
      minimumPaymentCents: 50000, // $500 MXN
      dueDay: 15,
      openedOn: '2023-01-01',
    }),
  );

  // Create balance snapshots
  const snapRepo = queryRunner.manager.getRepository(
    AccountBalanceSnapshotEntity,
  );
  await snapRepo.save([
    snapRepo.create({
      accountId: checking.id,
      account: checking,
      observedAt: new Date('2024-01-01'),
      balanceCents: 1000000, // $10,000 MXN
      source: SnapshotSource.Manual,
    }),
    snapRepo.create({
      accountId: savings.id,
      account: savings,
      observedAt: new Date('2024-01-01'),
      balanceCents: 5000000, // $50,000 MXN
      source: SnapshotSource.Manual,
    }),
    snapRepo.create({
      accountId: creditCard.id,
      account: creditCard,
      observedAt: new Date('2024-01-01'),
      balanceCents: -1500000, // -$15,000 MXN (owed)
      source: SnapshotSource.Manual,
    }),
  ]);

  // Create income source
  const sourceRepo = queryRunner.manager.getRepository(IncomeSourceEntity);
  const incomeSource = await sourceRepo.save(
    sourceRepo.create({
      planId: plan.id,
      plan,
      defaultDepositAccountId: checking.id,
      defaultDepositAccount: checking,
      name: 'Main Job',
      currency: 'MXN',
      active: true,
    }),
  );

  // Create income schedule
  const schedRepo = queryRunner.manager.getRepository(IncomeScheduleEntity);
  const schedule = await schedRepo.save(
    schedRepo.create({
      incomeSourceId: incomeSource.id,
      incomeSource,
      cadence: IncomeCadence.Semimonthly,
      anchorPaymentDate: '2024-01-15',
      recurrenceRule: 'FREQ=MONTHLY;BYMONTHDAY=15,30',
      generatedThrough: '2024-12-31',
      active: true,
    }),
  );

  // Create income schedule amount rules
  const ruleRepo = queryRunner.manager.getRepository(
    IncomeScheduleAmountRuleEntity,
  );
  await ruleRepo.save([
    ruleRepo.create({
      incomeScheduleId: schedule.id,
      incomeSchedule: schedule,
      paymentNumberInMonth: 1,
      amountCents: 1500000, // $15,000 MXN
      validFrom: '2024-01-01',
      validUntil: null,
    }),
    ruleRepo.create({
      incomeScheduleId: schedule.id,
      incomeSchedule: schedule,
      paymentNumberInMonth: 2,
      amountCents: 1500000, // $15,000 MXN
      validFrom: '2024-01-01',
      validUntil: null,
    }),
  ]);

  // Create income transaction + entries + payment
  const txRepo = queryRunner.manager.getRepository(TransactionEntity);
  const incomeTx = await txRepo.save(
    txRepo.create({
      planId: plan.id,
      plan,
      occurredAt: new Date('2024-01-15'),
      description: 'Salary payment',
      transactionType: TransactionType.Income,
      status: TransactionStatus.Posted,
    }),
  );

  const entryRepo = queryRunner.manager.getRepository(TransactionEntryEntity);
  await entryRepo.save([
    entryRepo.create({
      transactionId: incomeTx.id,
      transaction: incomeTx,
      accountId: checking.id,
      account: checking,
      amountCents: 1500000,
    }),
  ]);

  const paymentRepo = queryRunner.manager.getRepository(IncomePaymentEntity);
  await paymentRepo.save(
    paymentRepo.create({
      incomeSourceId: incomeSource.id,
      incomeSource,
      incomeScheduleId: schedule.id,
      incomeSchedule: schedule,
      transactionId: incomeTx.id,
      transaction: incomeTx,
      paidOn: '2024-01-15',
      paymentNumberInMonth: 1,
      status: IncomePaymentStatus.Received,
    }),
  );

  // Create budget period
  const periodRepo = queryRunner.manager.getRepository(BudgetPeriodEntity);
  const period = await periodRepo.save(
    periodRepo.create({
      planId: plan.id,
      plan,
      periodType: BudgetPeriodType.Monthly,
      startsOn: '2024-01-15',
      endsOn: '2024-01-30',
      fundingAmountCents: 1500000,
      status: BudgetPeriodStatus.Open,
    }),
  );

  // Create budget item
  const itemRepo = queryRunner.manager.getRepository(BudgetItemEntity);
  const budgetItem = await itemRepo.save(
    itemRepo.create({
      budgetPeriodId: period.id,
      budgetPeriod: period,
      categoryId: categories[0].id,
      category: categories[0],
      sourceAccountId: checking.id,
      sourceAccount: checking,
      dueOn: '2024-01-20',
      concept: 'Groceries',
      plannedAmountCents: 200000, // $2,000 MXN
      status: BudgetItemStatus.Planned,
      rolloverPolicy: RolloverPolicy.Expire,
    }),
  );

  // Create expense transaction + entry + budget allocation
  const expenseTx = await txRepo.save(
    txRepo.create({
      planId: plan.id,
      plan,
      categoryId: categories[0].id,
      category: categories[0],
      occurredAt: new Date('2024-01-20'),
      description: 'Grocery store',
      transactionType: TransactionType.Expense,
      status: TransactionStatus.Posted,
    }),
  );

  await entryRepo.save([
    entryRepo.create({
      transactionId: expenseTx.id,
      transaction: expenseTx,
      accountId: checking.id,
      account: checking,
      amountCents: -200000,
    }),
  ]);

  // Link budget item to transaction
  const bitRepo = queryRunner.manager.getRepository(
    BudgetItemTransactionEntity,
  );
  await bitRepo.save(
    bitRepo.create({
      budgetItemId: budgetItem.id,
      budgetItem,
      transactionId: expenseTx.id,
      transaction: expenseTx,
      allocatedAmountCents: 200000,
    }),
  );

  // Create recurring item
  const recurRepo = queryRunner.manager.getRepository(RecurringItemEntity);
  await recurRepo.save(
    recurRepo.create({
      planId: plan.id,
      plan,
      categoryId: categories[1].id,
      category: categories[1],
      sourceAccountId: creditCard.id,
      sourceAccount: creditCard,
      itemType: RecurringItemType.Expense,
      concept: 'Netflix',
      amountCents: 19900, // $199 MXN
      recurrenceRule: 'FREQ=MONTHLY;BYMONTHDAY=5',
      startsOn: '2024-01-05',
      active: true,
    }),
  );

  // Create debt projection run + point
  const runRepo = queryRunner.manager.getRepository(DebtProjectionRunEntity);
  const projectionRun = await runRepo.save(
    runRepo.create({
      planId: plan.id,
      plan,
      projectedFrom: '2024-01-01',
      generatedAt: new Date(),
      algorithmVersion: '1.0',
    }),
  );

  const pointRepo = queryRunner.manager.getRepository(
    DebtProjectionPointEntity,
  );
  await pointRepo.save(
    pointRepo.create({
      projectionRunId: projectionRun.id,
      projectionRun,
      accountId: creditCard.id,
      account: creditCard,
      projectedOn: '2024-02-01',
      balanceCents: -1450000, // Projected balance
    }),
  );

  // Create plan setting
  const settingRepo = queryRunner.manager.getRepository(PlanSettingEntity);
  await settingRepo.save(
    settingRepo.create({
      planId: plan.id,
      plan,
      key: 'notification_preferences',
      valueJson: JSON.stringify({ email: true, sms: false }),
    }),
  );

  // Create summary note
  const noteRepo = queryRunner.manager.getRepository(SummaryNoteEntity);
  await noteRepo.save(
    noteRepo.create({
      planId: plan.id,
      plan,
      note: 'Initial plan setup complete. Focus on debt reduction.',
    }),
  );

  return plan;
}

/**
 * Filters income payments to those referenced by budget periods,
 * excluding payments beyond the optional plan end date.
 */
export function filterIncomePayments(
  payments: Array<{ id: string; date: string }>,
  periods: Array<{ income?: { id: string } | null }>,
  planEndDate?: string | null,
): Array<{ id: string; date: string }> {
  const referencedIds = new Set(
    periods.flatMap((p) => (p.income?.id ? [p.income.id] : [])),
  );

  return payments.filter((p) => {
    if (!referencedIds.has(p.id)) {
      return false;
    }

    if (planEndDate && p.date > planEndDate) {
      return false;
    }

    return true;
  });
}

/**
 * Resolves generatedThrough date, clamped to the latest seeded payment date
 * and optional plan end date.
 */
export function resolveGeneratedThrough(
  config: { generated_through?: string | null },
  payments: Array<{ date: string }>,
  planEndDate?: string | null,
): string {
  const candidates: string[] = [];

  if (config.generated_through) {
    candidates.push(config.generated_through);
  }

  if (payments.length > 0) {
    const latestPayment = payments.reduce((latest, p) =>
      p.date > latest.date ? p : latest,
    );

    candidates.push(latestPayment.date);
  }

  if (planEndDate) {
    candidates.push(planEndDate);
  }

  if (candidates.length === 0) {
    throw new Error('Cannot resolve generatedThrough: no input dates provided');
  }

  return candidates.reduce((earliest, d) => (d < earliest ? d : earliest));
}

export async function deletePlanFinanciero(
  queryRunner: QueryRunner,
  metadataId: string,
): Promise<void> {
  await queryRunner.manager
    .getRepository(FinancialPlanEntity)
    .delete({ metadataId });
}

/**
 * Load plan financiero JSON (preserved for backward compatibility).
 */
export async function loadPlanFinancieroJson(
  filePath: string,
): Promise<Record<string, any>> {
  return JSON.parse(await readFile(filePath, 'utf8')) as Record<string, any>;
}
