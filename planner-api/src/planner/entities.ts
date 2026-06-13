import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

export enum PlanStatus {
  Active = 'active',
  Archived = 'archived',
  Draft = 'draft',
}

export enum AccountType {
  Debit = 'debit',
  CreditCard = 'credit_card',
  Loan = 'loan',
  Savings = 'savings',
  Investment = 'investment',
  Cash = 'cash',
}

export enum ItemStatus {
  Pending = 'pending',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum IncomeStatus {
  Projected = 'projected',
  Received = 'received',
  Cancelled = 'cancelled',
}

export enum IncomeSource {
  Generated = 'generated',
  Manual = 'manual',
  Imported = 'imported',
}

export enum IncomeCadence {
  Every14Days = 'every_14_days',
}

export enum IncomeGenerationMethod {
  RuleBased = 'rule_based',
}

export enum RecurringFrequency {
  Monthly = 'monthly',
  TwiceMonthly = 'twice_monthly',
  Yearly = 'yearly',
  PerPaymentPeriod = 'per_payment_period',
  MonthlyUntilLiquidated = 'monthly_until_liquidated',
}

export enum RecurringExpenseDayRule {
  LastFriday = 'last_friday',
}

@Entity('financial_plans')
@Unique(['metadataId'])
export class FinancialPlanEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'metadata_id' })
  metadataId: string;

  @Column({ name: 'schema_version', default: '1.0.0' })
  schemaVersion: string;

  @Column()
  name: string;

  @Column({ default: 'MXN' })
  currency: string;

  @Column({ name: 'start_date', type: 'date' })
  startDate: string;

  @Column({ name: 'end_date', type: 'date', nullable: true })
  endDate?: string | null;

  @Column({ type: 'varchar', default: PlanStatus.Active })
  status: PlanStatus;

  @Column({ type: 'text', nullable: true })
  objective?: string | null;

  @Column({ name: 'projected_debt_free_date', type: 'date', nullable: true })
  projectedDebtFreeDate?: string | null;

  @Column({ name: 'projected_emergency_fund', type: 'real', nullable: true })
  projectedEmergencyFund?: number | null;

  @OneToMany(() => AllocationCategoryEntity, (category) => category.plan, {
    cascade: true,
  })
  allocationCategories: any[];

  @OneToMany(() => AccountEntity, (account) => account.plan, { cascade: true })
  accounts: any[];

  @OneToOne(() => IncomeScheduleEntity, (schedule) => schedule.plan, {
    cascade: true,
  })
  incomeSchedule?: any;

  @OneToMany(() => IncomePaymentEntity, (payment) => payment.plan, {
    cascade: true,
  })
  incomePayments: any[];

  @OneToMany(() => PaymentPeriodEntity, (period) => period.plan, {
    cascade: true,
  })
  paymentPeriods: any[];

  @OneToMany(() => RecurringExpenseEntity, (expense) => expense.plan, {
    cascade: true,
  })
  recurringExpenses: any[];

  @OneToMany(() => CompletedItemEntity, (item) => item.plan, { cascade: true })
  completedItems: any[];

  @OneToMany(() => PlanRuleEntity, (rule) => rule.plan, { cascade: true })
  rules: any[];

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('allocation_categories')
@Unique(['plan', 'key'])
export class AllocationCategoryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => FinancialPlanEntity, (plan) => plan.allocationCategories, {
    onDelete: 'CASCADE',
  })
  plan: FinancialPlanEntity;

  @Column()
  key: string;

  @Column()
  name: string;

  @Column({ type: 'real' })
  percentage: number;

  @Column({ type: 'text', nullable: true })
  description?: string | null;
}

@Entity('accounts')
@Unique(['plan', 'externalId'])
export class AccountEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => FinancialPlanEntity, (plan) => plan.accounts, {
    onDelete: 'CASCADE',
  })
  plan: FinancialPlanEntity;

  @Column({ name: 'external_id' })
  externalId: string;

  @Column()
  name: string;

  @Column({ type: 'varchar' })
  type: AccountType;
}

@Entity('income_schedules')
export class IncomeScheduleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => FinancialPlanEntity, (plan) => plan.incomeSchedule, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'plan_id' })
  plan: FinancialPlanEntity;

  @Column({ type: 'varchar' })
  cadence: IncomeCadence;

  @Column({ name: 'anchor_payment_date', type: 'date' })
  anchorPaymentDate: string;

  @Column({ default: 'MXN' })
  currency: string;

  @Column({ name: 'ordinary_month_gross_income', type: 'real', nullable: true })
  ordinaryMonthGrossIncome?: number | null;

  @Column({
    name: 'ordinary_month_net_reference',
    type: 'real',
    nullable: true,
  })
  ordinaryMonthNetReference?: number | null;

  @Column({ name: 'generated_through', type: 'date', nullable: true })
  generatedThrough?: string | null;

  @Column({ name: 'generation_method', type: 'varchar', nullable: true })
  generationMethod?: IncomeGenerationMethod | null;

  @Column({ name: 'calculation_rule', type: 'text', nullable: true })
  calculationRule?: string | null;

  @OneToMany(
    () => IncomeScheduleAmountRuleEntity,
    (rule) => rule.incomeSchedule,
    { cascade: true },
  )
  amountRules: any[];
}

@Entity('income_schedule_amount_rules')
@Unique(['incomeSchedule', 'paymentNumberInMonth'])
export class IncomeScheduleAmountRuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => IncomeScheduleEntity, (schedule) => schedule.amountRules, {
    onDelete: 'CASCADE',
  })
  incomeSchedule: IncomeScheduleEntity;

  @Column({ name: 'payment_number_in_month', type: 'integer' })
  paymentNumberInMonth: number;

  @Column({ type: 'real' })
  amount: number;

  @Column({ default: 'MXN' })
  currency: string;
}

@Entity('income_payments')
@Unique(['plan', 'externalId'])
export class IncomePaymentEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => FinancialPlanEntity, (plan) => plan.incomePayments, {
    onDelete: 'CASCADE',
  })
  plan: FinancialPlanEntity;

  @ManyToOne(() => IncomeScheduleEntity, {
    nullable: true,
    onDelete: 'SET NULL',
  })
  incomeSchedule?: IncomeScheduleEntity | null;

  @Column({ name: 'external_id', type: 'varchar', nullable: true })
  externalId?: string | null;

  @Column({ type: 'date' })
  date: string;

  @Column()
  month: string;

  @Column({ name: 'payment_number_in_month', type: 'integer' })
  paymentNumberInMonth: number;

  @Column({ type: 'real' })
  amount: number;

  @Column({ default: 'MXN' })
  currency: string;

  @Column({ type: 'varchar', default: IncomeStatus.Projected })
  status: IncomeStatus;

  @Column({ type: 'varchar', default: IncomeSource.Manual })
  source: IncomeSource;
}

@Entity('payment_periods')
@Unique(['plan', 'externalId'])
export class PaymentPeriodEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => FinancialPlanEntity, (plan) => plan.paymentPeriods, {
    onDelete: 'CASCADE',
  })
  plan: FinancialPlanEntity;

  @OneToOne(() => IncomePaymentEntity, { nullable: true, onDelete: 'SET NULL' })
  @JoinColumn({ name: 'income_payment_id' })
  incomePayment?: IncomePaymentEntity | null;

  @Column({ name: 'external_id', type: 'varchar', nullable: true })
  externalId?: string | null;

  @Column({ name: 'income_date', type: 'date' })
  incomeDate: string;

  @Column({ name: 'planned_total', type: 'real', default: 0 })
  plannedTotal: number;

  @Column({ name: 'planned_remaining', type: 'real', default: 0 })
  plannedRemaining: number;

  @OneToMany(() => PaymentPeriodItemEntity, (item) => item.paymentPeriod, {
    cascade: true,
  })
  items: any[];
}

@Entity('payment_period_items')
@Unique(['paymentPeriod', 'externalId'])
export class PaymentPeriodItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => PaymentPeriodEntity, (period) => period.items, {
    onDelete: 'CASCADE',
  })
  paymentPeriod: PaymentPeriodEntity;

  @Column({ name: 'external_id', type: 'varchar', nullable: true })
  externalId?: string | null;

  @Column({ type: 'date' })
  date: string;

  @Column()
  concept: string;

  @Column({ name: 'planned_amount', type: 'real' })
  plannedAmount: number;

  @Column({ name: 'actual_amount', type: 'real', nullable: true })
  actualAmount?: number | null;

  @Column({ type: 'varchar', nullable: true })
  category?: string | null;

  @Column({ type: 'varchar', nullable: true })
  account?: string | null;

  @Column({ name: 'funding_account', type: 'varchar', nullable: true })
  fundingAccount?: string | null;

  @Column({ type: 'varchar', default: ItemStatus.Pending })
  status: ItemStatus;

  @Column({ name: 'completed_at', type: 'datetime', nullable: true })
  completedAt?: Date | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ name: 'non_rollover', default: false })
  nonRollover: boolean;

  @Column({ name: 'treated_as_spent_if_unused', default: false })
  treatedAsSpentIfUnused: boolean;
}

@Entity('recurring_expenses')
export class RecurringExpenseEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => FinancialPlanEntity, (plan) => plan.recurringExpenses, {
    onDelete: 'CASCADE',
  })
  plan: FinancialPlanEntity;

  @Column()
  concept: string;

  @Column({ type: 'real' })
  amount: number;

  @Column({ type: 'varchar' })
  frequency: RecurringFrequency;

  @Column({ type: 'integer', nullable: true })
  day?: number | null;

  @Column({ type: 'date', nullable: true })
  date?: string | null;

  @Column({ name: 'day_rule', type: 'varchar', nullable: true })
  dayRule?: RecurringExpenseDayRule | null;

  @Column({ type: 'varchar', nullable: true })
  account?: string | null;

  @Column({ name: 'funding_account', type: 'varchar', nullable: true })
  fundingAccount?: string | null;

  @Column({ type: 'varchar', nullable: true })
  category?: string | null;

  @Column({ name: 'non_rollover', default: false })
  nonRollover: boolean;

  @Column({ name: 'last_payment_date', type: 'date', nullable: true })
  lastPaymentDate?: string | null;

  @Column({ name: 'last_payment_amount', type: 'real', nullable: true })
  lastPaymentAmount?: number | null;

  @OneToMany(() => RecurringExpenseDayEntity, (day) => day.recurringExpense, {
    cascade: true,
  })
  days: any[];
}

@Entity('recurring_expense_days')
export class RecurringExpenseDayEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => RecurringExpenseEntity, (expense) => expense.days, {
    onDelete: 'CASCADE',
  })
  recurringExpense: RecurringExpenseEntity;

  @Column({ type: 'integer' })
  day: number;
}

@Entity('completed_items')
@Unique(['plan', 'externalId'])
export class CompletedItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => FinancialPlanEntity, (plan) => plan.completedItems, {
    onDelete: 'CASCADE',
  })
  plan: FinancialPlanEntity;

  @Column({ name: 'external_id', type: 'varchar', nullable: true })
  externalId?: string | null;

  @Column({ type: 'date' })
  date: string;

  @Column()
  concept: string;

  @Column({ type: 'real' })
  amount: number;

  @Column({ type: 'varchar', nullable: true })
  type?: string | null;

  @Column({ type: 'varchar', nullable: true })
  category?: string | null;

  @Column({ name: 'from_account', type: 'varchar', nullable: true })
  fromAccount?: string | null;

  @Column({ name: 'to_account', type: 'varchar', nullable: true })
  toAccount?: string | null;

  @Column({ type: 'varchar', nullable: true })
  account?: string | null;

  @Column({ type: 'varchar', default: ItemStatus.Completed })
  status: ItemStatus;
}

@Entity('pre_income_allocations')
export class PreIncomeAllocationEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => FinancialPlanEntity, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'plan_id' })
  plan: FinancialPlanEntity;

  @Column({ name: 'available_amount', type: 'real' })
  availableAmount: number;

  @Column({ name: 'period_end', type: 'date' })
  periodEnd: string;

  @OneToMany(
    () => PreIncomeAllocationItemEntity,
    (item) => item.preIncomeAllocation,
    { cascade: true },
  )
  items: any[];
}

@Entity('pre_income_allocation_items')
export class PreIncomeAllocationItemEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => PreIncomeAllocationEntity,
    (allocation) => allocation.items,
    { onDelete: 'CASCADE' },
  )
  preIncomeAllocation: PreIncomeAllocationEntity;

  @Column({ name: 'external_id', type: 'varchar', nullable: true })
  externalId?: string | null;

  @Column({ type: 'date' })
  date: string;

  @Column()
  concept: string;

  @Column({ type: 'real' })
  amount: number;

  @Column({ type: 'varchar', nullable: true })
  category?: string | null;

  @Column({ type: 'varchar', nullable: true })
  account?: string | null;

  @Column({ type: 'varchar', default: ItemStatus.Pending })
  status: ItemStatus;

  @Column({ name: 'non_rollover', default: false })
  nonRollover: boolean;
}

@Entity('current_account_balances')
export class CurrentAccountBalanceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => FinancialPlanEntity, { onDelete: 'CASCADE' })
  plan: FinancialPlanEntity;

  @Column({ name: 'as_of', type: 'date' })
  asOf: string;

  @Column({ name: 'account_name' })
  accountName: string;

  @Column({ type: 'real' })
  amount: number;

  @Column({ default: 'MXN' })
  currency: string;
}

@Entity('current_debt_balances')
export class CurrentDebtBalanceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => FinancialPlanEntity, { onDelete: 'CASCADE' })
  plan: FinancialPlanEntity;

  @Column({ name: 'as_of', type: 'date' })
  asOf: string;

  @Column({ name: 'debt_name' })
  debtName: string;

  @Column({ type: 'real' })
  amount: number;

  @Column({ default: 'MXN' })
  currency: string;
}

@Entity('debt_projection_snapshots')
export class DebtProjectionSnapshotEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => FinancialPlanEntity, { onDelete: 'CASCADE' })
  plan: FinancialPlanEntity;

  @Column({ type: 'date' })
  date: string;

  @OneToMany(() => DebtProjectionBalanceEntity, (balance) => balance.snapshot, {
    cascade: true,
  })
  balances: any[];
}

@Entity('debt_projection_balances')
export class DebtProjectionBalanceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(
    () => DebtProjectionSnapshotEntity,
    (snapshot) => snapshot.balances,
    { onDelete: 'CASCADE' },
  )
  snapshot: DebtProjectionSnapshotEntity;

  @Column({ name: 'account_name' })
  accountName: string;

  @Column({ type: 'real' })
  amount: number;
}

@Entity('plan_rules')
@Unique(['plan', 'key'])
export class PlanRuleEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => FinancialPlanEntity, (plan) => plan.rules, {
    onDelete: 'CASCADE',
  })
  plan: FinancialPlanEntity;

  @Column()
  key: string;

  @Column({ name: 'value_json', type: 'simple-json' })
  valueJson: unknown;
}

@Entity('summary_notes')
export class SummaryNoteEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => FinancialPlanEntity, { onDelete: 'CASCADE' })
  plan: FinancialPlanEntity;

  @Column({ type: 'text' })
  note: string;
}

export const plannerEntities = [
  FinancialPlanEntity,
  AllocationCategoryEntity,
  AccountEntity,
  IncomeScheduleEntity,
  IncomeScheduleAmountRuleEntity,
  IncomePaymentEntity,
  PaymentPeriodEntity,
  PaymentPeriodItemEntity,
  RecurringExpenseEntity,
  RecurringExpenseDayEntity,
  CompletedItemEntity,
  PreIncomeAllocationEntity,
  PreIncomeAllocationItemEntity,
  CurrentAccountBalanceEntity,
  CurrentDebtBalanceEntity,
  DebtProjectionSnapshotEntity,
  DebtProjectionBalanceEntity,
  PlanRuleEntity,
  SummaryNoteEntity,
];
