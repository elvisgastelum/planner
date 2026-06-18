import type { Relation } from 'typeorm';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryColumn,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

// =============================================================================
// ENUMS / CONSTANTS
// =============================================================================

export enum PlanStatus {
  Active = 'active',
  Archived = 'archived',
  Draft = 'draft',
}

export enum FinancialAccountType {
  Cash = 'cash',
  Checking = 'checking',
  Savings = 'savings',
  Investment = 'investment',
  CreditCard = 'credit_card',
  PersonalLoan = 'personal_loan',
  Mortgage = 'mortgage',
  StoreCredit = 'store_credit',
  LineOfCredit = 'line_of_credit',
  OtherAsset = 'other_asset',
  OtherLiability = 'other_liability',
}

export enum FinancialAccountStatus {
  Active = 'active',
  Archived = 'archived',
  Closed = 'closed',
}

export enum SnapshotSource {
  Manual = 'manual',
  Import = 'import',
  System = 'system',
  Reconciliation = 'reconciliation',
}

export enum IncomeCadence {
  Every14Days = 'every_14_days',
  Biweekly = 'biweekly',
  Monthly = 'monthly',
  Semimonthly = 'semimonthly',
}

export enum IncomePaymentStatus {
  Projected = 'projected',
  Received = 'received',
  Cancelled = 'cancelled',
}

export enum BudgetPeriodType {
  Opening = 'opening',
  Income = 'income',
  Manual = 'manual',
  Monthly = 'monthly',
}

export enum BudgetPeriodStatus {
  Open = 'open',
  Closed = 'closed',
  Reconciled = 'reconciled',
}

export enum BudgetItemStatus {
  Planned = 'planned',
  Active = 'active',
  Completed = 'completed',
  Cancelled = 'cancelled',
}

export enum RolloverPolicy {
  Rollover = 'rollover',
  Expire = 'expire',
  TreatAsSpent = 'treat_as_spent',
}

export enum RecurringItemType {
  Expense = 'expense',
  Transfer = 'transfer',
  DebtPayment = 'debt_payment',
  Savings = 'savings',
  Other = 'other',
}

export enum TransactionType {
  Income = 'income',
  Expense = 'expense',
  Transfer = 'transfer',
  DebtCharge = 'debt_charge',
  DebtPayment = 'debt_payment',
  BalanceAdjustment = 'balance_adjustment',
  Other = 'other',
}

export enum TransactionStatus {
  Pending = 'pending',
  Posted = 'posted',
  Void = 'void',
}

export const LIABILITY_ACCOUNT_TYPES: Set<FinancialAccountType> = new Set([
  FinancialAccountType.CreditCard,
  FinancialAccountType.PersonalLoan,
  FinancialAccountType.Mortgage,
  FinancialAccountType.StoreCredit,
  FinancialAccountType.LineOfCredit,
  FinancialAccountType.OtherLiability,
]);

// =============================================================================
// ENTITIES
// =============================================================================

@Entity('financial_plans')
@Unique(['metadataId'])
export class FinancialPlanEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'metadata_id', unique: true })
  metadataId: string;

  @Column({ name: 'schema_version', default: '1.0.0' })
  schemaVersion: string;

  @Column()
  name: string;

  @Column({ name: 'base_currency', length: 3, default: 'MXN' })
  baseCurrency: string;

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

  @Column({
    name: 'projected_emergency_fund_cents',
    type: 'integer',
    nullable: true,
  })
  projectedEmergencyFundCents?: number | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => AllocationCategoryEntity, (category) => category.plan)
  categories: Relation<AllocationCategoryEntity[]>;

  @OneToMany(() => FinancialAccountEntity, (account) => account.plan)
  accounts: Relation<FinancialAccountEntity[]>;

  @OneToMany(() => IncomeSourceEntity, (source) => source.plan)
  incomeSources: Relation<IncomeSourceEntity[]>;

  @OneToMany(() => BudgetPeriodEntity, (period) => period.plan)
  budgetPeriods: Relation<BudgetPeriodEntity[]>;

  @OneToMany(() => RecurringItemEntity, (item) => item.plan)
  recurringItems: Relation<RecurringItemEntity[]>;

  @OneToMany(() => TransactionEntity, (tx) => tx.plan)
  transactions: Relation<TransactionEntity[]>;

  @OneToMany(() => DebtProjectionRunEntity, (run) => run.plan)
  projectionRuns: Relation<DebtProjectionRunEntity[]>;

  @OneToMany(() => PlanSettingEntity, (setting) => setting.plan)
  settings: Relation<PlanSettingEntity[]>;

  @OneToMany(() => SummaryNoteEntity, (note) => note.plan)
  summaryNotes: Relation<SummaryNoteEntity[]>;
}

@Entity('allocation_categories')
@Unique(['planId', 'code'])
@Index(['planId'])
export class AllocationCategoryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'plan_id' })
  planId: string;

  @ManyToOne(() => FinancialPlanEntity, (plan) => plan.categories, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'plan_id' })
  plan: Relation<FinancialPlanEntity>;

  @Column()
  code: string;

  @Column()
  name: string;

  @Column({ name: 'ideal_percentage_bps', type: 'integer' })
  idealPercentageBps: number;

  @Column({ type: 'text', nullable: true })
  description?: string | null;

  @Column({ name: 'archived_at', type: 'datetime', nullable: true })
  archivedAt?: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('financial_accounts')
@Index(['planId'])
export class FinancialAccountEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'plan_id' })
  planId: string;

  @ManyToOne(() => FinancialPlanEntity, (plan) => plan.accounts, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'plan_id' })
  plan: Relation<FinancialPlanEntity>;

  @Column({ name: 'external_source', type: 'varchar', nullable: true })
  externalSource?: string | null;

  @Column({ name: 'external_id', type: 'varchar', nullable: true })
  externalId?: string | null;

  @Column()
  name: string;

  @Column({ name: 'account_type', type: 'varchar' })
  accountType: FinancialAccountType;

  @Column({ length: 3 })
  currency: string;

  @Column({ type: 'varchar', default: FinancialAccountStatus.Active })
  status: FinancialAccountStatus;

  @Column({ name: 'archived_at', type: 'datetime', nullable: true })
  archivedAt?: Date | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToOne(() => LiabilityTermsEntity, (terms) => terms.account, {
    cascade: ['insert', 'update'],
  })
  liabilityTerms?: Relation<LiabilityTermsEntity>;

  @OneToMany(() => AccountBalanceSnapshotEntity, (snapshot) => snapshot.account)
  balanceSnapshots: Relation<AccountBalanceSnapshotEntity[]>;

  @OneToMany(() => TransactionEntryEntity, (entry) => entry.account)
  entries: Relation<TransactionEntryEntity[]>;

  @OneToMany(() => DebtProjectionPointEntity, (point) => point.account)
  projectionPoints: Relation<DebtProjectionPointEntity[]>;
}

@Entity('liability_terms')
export class LiabilityTermsEntity {
  @PrimaryColumn({ name: 'account_id', type: 'varchar' })
  accountId: string;

  @OneToOne(() => FinancialAccountEntity, (account) => account.liabilityTerms, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'account_id' })
  account: Relation<FinancialAccountEntity>;

  @Column({ name: 'original_principal_cents', type: 'integer', nullable: true })
  originalPrincipalCents?: number | null;

  @Column({ name: 'credit_limit_cents', type: 'integer', nullable: true })
  creditLimitCents?: number | null;

  @Column({ name: 'apr_bps', type: 'integer', nullable: true })
  aprBps?: number | null;

  @Column({ name: 'minimum_payment_cents', type: 'integer', nullable: true })
  minimumPaymentCents?: number | null;

  @Column({ name: 'due_day', type: 'integer', nullable: true })
  dueDay?: number | null;

  @Column({ name: 'opened_on', type: 'date', nullable: true })
  openedOn?: string | null;

  @Column({ name: 'maturity_date', type: 'date', nullable: true })
  maturityDate?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('account_balance_snapshots')
@Index(['accountId', 'observedAt'])
export class AccountBalanceSnapshotEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'account_id' })
  accountId: string;

  @ManyToOne(
    () => FinancialAccountEntity,
    (account) => account.balanceSnapshots,
    {
      onDelete: 'CASCADE',
      nullable: false,
    },
  )
  @JoinColumn({ name: 'account_id' })
  account: Relation<FinancialAccountEntity>;

  @Column({ name: 'observed_at', type: 'datetime' })
  observedAt: Date;

  @Column({ name: 'balance_cents', type: 'integer' })
  balanceCents: number;

  @Column({ type: 'varchar' })
  source: SnapshotSource;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('income_sources')
@Index(['planId'])
export class IncomeSourceEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'plan_id' })
  planId: string;

  @ManyToOne(() => FinancialPlanEntity, (plan) => plan.incomeSources, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'plan_id' })
  plan: Relation<FinancialPlanEntity>;

  @Column({
    name: 'default_deposit_account_id',
    type: 'varchar',
    nullable: true,
  })
  defaultDepositAccountId?: string | null;

  @ManyToOne(() => FinancialAccountEntity, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'default_deposit_account_id' })
  defaultDepositAccount?: Relation<FinancialAccountEntity> | null;

  @Column()
  name: string;

  @Column({ length: 3 })
  currency: string;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => IncomeScheduleEntity, (schedule) => schedule.incomeSource)
  schedules: Relation<IncomeScheduleEntity[]>;

  @OneToMany(() => IncomePaymentEntity, (payment) => payment.incomeSource)
  payments: Relation<IncomePaymentEntity[]>;
}

@Entity('income_schedules')
export class IncomeScheduleEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'income_source_id' })
  incomeSourceId: string;

  @ManyToOne(() => IncomeSourceEntity, (source) => source.schedules, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'income_source_id' })
  incomeSource: Relation<IncomeSourceEntity>;

  @Column()
  cadence: IncomeCadence;

  @Column({ name: 'anchor_payment_date', type: 'date' })
  anchorPaymentDate: string;

  @Column({ name: 'recurrence_rule', type: 'text', nullable: true })
  recurrenceRule?: string | null;

  @Column({ name: 'generated_through', type: 'date', nullable: true })
  generatedThrough?: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(
    () => IncomeScheduleAmountRuleEntity,
    (rule) => rule.incomeSchedule,
  )
  amountRules: Relation<IncomeScheduleAmountRuleEntity[]>;
}

@Entity('income_schedule_amount_rules')
export class IncomeScheduleAmountRuleEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'income_schedule_id' })
  incomeScheduleId: string;

  @ManyToOne(() => IncomeScheduleEntity, (schedule) => schedule.amountRules, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'income_schedule_id' })
  incomeSchedule: Relation<IncomeScheduleEntity>;

  @Column({ name: 'payment_number_in_month', type: 'integer', nullable: true })
  paymentNumberInMonth?: number | null;

  @Column({ name: 'amount_cents', type: 'integer' })
  amountCents: number;

  @Column({ name: 'valid_from', type: 'date', nullable: true })
  validFrom?: string | null;

  @Column({ name: 'valid_until', type: 'date', nullable: true })
  validUntil?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('transactions')
@Index(['planId', 'occurredAt'])
export class TransactionEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'plan_id' })
  planId: string;

  @ManyToOne(() => FinancialPlanEntity, (plan) => plan.transactions, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'plan_id' })
  plan: Relation<FinancialPlanEntity>;

  @Column({ name: 'external_source', type: 'varchar', nullable: true })
  externalSource?: string | null;

  @Column({ name: 'external_id', type: 'varchar', nullable: true })
  externalId?: string | null;

  @Column({ name: 'category_id', type: 'varchar', nullable: true })
  categoryId?: string | null;

  @ManyToOne(() => AllocationCategoryEntity, {
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'category_id' })
  category?: Relation<AllocationCategoryEntity> | null;

  @Column({ name: 'occurred_at', type: 'datetime' })
  occurredAt: Date;

  @Column()
  description: string;

  @Column({ name: 'transaction_type', type: 'varchar' })
  transactionType: TransactionType;

  @Column({ type: 'varchar' })
  status: TransactionStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => TransactionEntryEntity, (entry) => entry.transaction)
  entries: Relation<TransactionEntryEntity[]>;

  @OneToOne(() => IncomePaymentEntity, (payment) => payment.transaction, {
    nullable: true,
  })
  incomePayment?: Relation<IncomePaymentEntity> | null;

  @OneToMany(() => BudgetItemTransactionEntity, (bit) => bit.transaction)
  budgetAllocations: Relation<BudgetItemTransactionEntity[]>;
}

@Entity('transaction_entries')
@Index(['transactionId'])
@Index(['accountId'])
export class TransactionEntryEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'transaction_id' })
  transactionId: string;

  @ManyToOne(() => TransactionEntity, (tx) => tx.entries, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'transaction_id' })
  transaction: Relation<TransactionEntity>;

  @Column({ name: 'account_id' })
  accountId: string;

  @ManyToOne(() => FinancialAccountEntity, {
    onDelete: 'NO ACTION',
    nullable: false,
  })
  @JoinColumn({ name: 'account_id' })
  account: Relation<FinancialAccountEntity>;

  @Column({ name: 'amount_cents', type: 'integer' })
  amountCents: number;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

@Entity('income_payments')
@Unique(['transactionId'])
@Index(['incomeSourceId'])
export class IncomePaymentEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'income_source_id' })
  incomeSourceId: string;

  @ManyToOne(() => IncomeSourceEntity, (source) => source.payments, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'income_source_id' })
  incomeSource: Relation<IncomeSourceEntity>;

  @Column({ name: 'income_schedule_id', type: 'varchar', nullable: true })
  incomeScheduleId?: string | null;

  @ManyToOne(() => IncomeScheduleEntity, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'income_schedule_id' })
  incomeSchedule?: Relation<IncomeScheduleEntity> | null;

  @Column({ name: 'transaction_id', type: 'varchar', nullable: true })
  transactionId?: string | null;

  @OneToOne(() => TransactionEntity, (tx) => tx.incomePayment, {
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'transaction_id' })
  transaction?: Relation<TransactionEntity> | null;

  @Column({ name: 'external_source', type: 'varchar', nullable: true })
  externalSource?: string | null;

  @Column({ name: 'external_id', type: 'varchar', nullable: true })
  externalId?: string | null;

  @Column({ name: 'paid_on', type: 'date' })
  paidOn: string;

  @Column({ name: 'payment_number_in_month', type: 'integer', nullable: true })
  paymentNumberInMonth?: number | null;

  @Column({ type: 'varchar', default: IncomePaymentStatus.Projected })
  status: IncomePaymentStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('budget_periods')
@Index(['planId'])
export class BudgetPeriodEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'plan_id' })
  planId: string;

  @ManyToOne(() => FinancialPlanEntity, (plan) => plan.budgetPeriods, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'plan_id' })
  plan: Relation<FinancialPlanEntity>;

  @Column({ name: 'income_payment_id', type: 'varchar', nullable: true })
  incomePaymentId?: string | null;

  @ManyToOne(() => IncomePaymentEntity, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'income_payment_id' })
  incomePayment?: Relation<IncomePaymentEntity> | null;

  @Column({ name: 'period_type', type: 'varchar' })
  periodType: BudgetPeriodType;

  @Column({ name: 'starts_on', type: 'date' })
  startsOn: string;

  @Column({ name: 'ends_on', type: 'date' })
  endsOn: string;

  @Column({ name: 'funding_amount_cents', type: 'integer' })
  fundingAmountCents: number;

  @Column({ type: 'varchar', default: BudgetPeriodStatus.Open })
  status: BudgetPeriodStatus;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => BudgetItemEntity, (item) => item.budgetPeriod)
  items: Relation<BudgetItemEntity[]>;
}

@Entity('recurring_items')
@Index(['planId'])
export class RecurringItemEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'plan_id' })
  planId: string;

  @ManyToOne(() => FinancialPlanEntity, (plan) => plan.recurringItems, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'plan_id' })
  plan: Relation<FinancialPlanEntity>;

  @Column({ name: 'category_id', type: 'varchar', nullable: true })
  categoryId?: string | null;

  @ManyToOne(() => AllocationCategoryEntity, {
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'category_id' })
  category?: Relation<AllocationCategoryEntity> | null;

  @Column({ name: 'source_account_id', type: 'varchar', nullable: true })
  sourceAccountId?: string | null;

  @ManyToOne(() => FinancialAccountEntity, {
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'source_account_id' })
  sourceAccount?: Relation<FinancialAccountEntity> | null;

  @Column({ name: 'destination_account_id', type: 'varchar', nullable: true })
  destinationAccountId?: string | null;

  @ManyToOne(() => FinancialAccountEntity, {
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'destination_account_id' })
  destinationAccount?: Relation<FinancialAccountEntity> | null;

  @Column({ name: 'item_type', type: 'varchar' })
  itemType: RecurringItemType;

  @Column()
  concept: string;

  @Column({ name: 'amount_cents', type: 'integer' })
  amountCents: number;

  @Column({ name: 'recurrence_rule', type: 'text' })
  recurrenceRule: string;

  @Column({ name: 'starts_on', type: 'date', nullable: true })
  startsOn?: string | null;

  @Column({ name: 'ends_on', type: 'date', nullable: true })
  endsOn?: string | null;

  @Column({ name: 'last_generated_on', type: 'date', nullable: true })
  lastGeneratedOn?: string | null;

  @Column({ type: 'boolean', default: true })
  active: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => BudgetItemEntity, (item) => item.recurringItem)
  budgetItems: Relation<BudgetItemEntity[]>;
}

@Entity('budget_items')
@Index(['budgetPeriodId', 'dueOn'])
export class BudgetItemEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'budget_period_id' })
  budgetPeriodId: string;

  @ManyToOne(() => BudgetPeriodEntity, (period) => period.items, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'budget_period_id' })
  budgetPeriod: Relation<BudgetPeriodEntity>;

  @Column({ name: 'external_id', type: 'varchar', nullable: true })
  externalId?: string | null;

  @Column({ name: 'recurring_item_id', type: 'varchar', nullable: true })
  recurringItemId?: string | null;

  @ManyToOne(() => RecurringItemEntity, {
    onDelete: 'SET NULL',
  })
  @JoinColumn({ name: 'recurring_item_id' })
  recurringItem?: Relation<RecurringItemEntity> | null;

  @Column({ name: 'category_id', type: 'varchar', nullable: true })
  categoryId?: string | null;

  @ManyToOne(() => AllocationCategoryEntity, {
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'category_id' })
  category?: Relation<AllocationCategoryEntity> | null;

  @Column({ name: 'source_account_id', type: 'varchar', nullable: true })
  sourceAccountId?: string | null;

  @ManyToOne(() => FinancialAccountEntity, {
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'source_account_id' })
  sourceAccount?: Relation<FinancialAccountEntity> | null;

  @Column({ name: 'destination_account_id', type: 'varchar', nullable: true })
  destinationAccountId?: string | null;

  @ManyToOne(() => FinancialAccountEntity, {
    onDelete: 'NO ACTION',
  })
  @JoinColumn({ name: 'destination_account_id' })
  destinationAccount?: Relation<FinancialAccountEntity> | null;

  @Column({ name: 'due_on', type: 'date' })
  dueOn: string;

  @Column()
  concept: string;

  @Column({ name: 'planned_amount_cents', type: 'integer' })
  plannedAmountCents: number;

  @Column({ type: 'varchar', default: BudgetItemStatus.Planned })
  status: BudgetItemStatus;

  @Column({
    name: 'rollover_policy',
    type: 'varchar',
    default: RolloverPolicy.Expire,
  })
  rolloverPolicy: RolloverPolicy;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  // Relations
  @OneToMany(() => BudgetItemTransactionEntity, (bit) => bit.budgetItem)
  allocations: Relation<BudgetItemTransactionEntity[]>;
}

@Entity('budget_item_transactions')
@Unique(['budgetItemId', 'transactionId'])
export class BudgetItemTransactionEntity {
  @PrimaryColumn({ name: 'budget_item_id', type: 'varchar' })
  budgetItemId: string;

  @PrimaryColumn({ name: 'transaction_id', type: 'varchar' })
  transactionId: string;

  @ManyToOne(() => BudgetItemEntity, (item) => item.allocations, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'budget_item_id' })
  budgetItem: Relation<BudgetItemEntity>;

  @ManyToOne(() => TransactionEntity, (tx) => tx.budgetAllocations, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'transaction_id' })
  transaction: Relation<TransactionEntity>;

  @Column({ name: 'allocated_amount_cents', type: 'integer' })
  allocatedAmountCents: number;
}

@Entity('debt_projection_runs')
export class DebtProjectionRunEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'plan_id' })
  planId: string;

  @ManyToOne(() => FinancialPlanEntity, (plan) => plan.projectionRuns, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'plan_id' })
  plan: Relation<FinancialPlanEntity>;

  @Column({ name: 'projected_from', type: 'date' })
  projectedFrom: string;

  @Column({ name: 'generated_at', type: 'datetime' })
  generatedAt: Date;

  @Column({ name: 'algorithm_version' })
  algorithmVersion: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  // Relations
  @OneToMany(() => DebtProjectionPointEntity, (point) => point.projectionRun)
  points: Relation<DebtProjectionPointEntity[]>;
}

@Entity('debt_projection_points')
@Unique(['projectionRunId', 'accountId', 'projectedOn'])
export class DebtProjectionPointEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'projection_run_id' })
  projectionRunId: string;

  @ManyToOne(() => DebtProjectionRunEntity, (run) => run.points, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'projection_run_id' })
  projectionRun: Relation<DebtProjectionRunEntity>;

  @Column({ name: 'account_id' })
  accountId: string;

  @ManyToOne(() => FinancialAccountEntity, {
    onDelete: 'NO ACTION',
    nullable: false,
  })
  @JoinColumn({ name: 'account_id' })
  account: Relation<FinancialAccountEntity>;

  @Column({ name: 'projected_on', type: 'date' })
  projectedOn: string;

  @Column({ name: 'balance_cents', type: 'integer' })
  balanceCents: number;
}

@Entity('plan_settings')
@Unique(['planId', 'key'])
export class PlanSettingEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'plan_id' })
  planId: string;

  @ManyToOne(() => FinancialPlanEntity, (plan) => plan.settings, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'plan_id' })
  plan: Relation<FinancialPlanEntity>;

  @Column()
  key: string;

  @Column({ name: 'value_json', type: 'text' })
  valueJson: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

@Entity('summary_notes')
export class SummaryNoteEntity {
  @PrimaryGeneratedColumn('uuid', { name: 'id' })
  id: string;

  @Column({ name: 'plan_id' })
  planId: string;

  @ManyToOne(() => FinancialPlanEntity, (plan) => plan.summaryNotes, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({ name: 'plan_id' })
  plan: Relation<FinancialPlanEntity>;

  @Column({ type: 'text' })
  note: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

// =============================================================================
// EXPORTS
// =============================================================================

export const plannerEntities = [
  FinancialPlanEntity,
  AllocationCategoryEntity,
  FinancialAccountEntity,
  LiabilityTermsEntity,
  AccountBalanceSnapshotEntity,
  IncomeSourceEntity,
  IncomeScheduleEntity,
  IncomeScheduleAmountRuleEntity,
  TransactionEntity,
  TransactionEntryEntity,
  IncomePaymentEntity,
  BudgetPeriodEntity,
  RecurringItemEntity,
  BudgetItemEntity,
  BudgetItemTransactionEntity,
  DebtProjectionRunEntity,
  DebtProjectionPointEntity,
  PlanSettingEntity,
  SummaryNoteEntity,
];
