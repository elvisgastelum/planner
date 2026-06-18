import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import {
  BudgetItemStatus,
  BudgetPeriodStatus,
  BudgetPeriodType,
  FinancialAccountStatus,
  FinancialAccountType,
  IncomeCadence,
  IncomePaymentStatus,
  PlanStatus,
  RecurringItemType,
  RolloverPolicy,
  SnapshotSource,
  TransactionStatus,
  TransactionType,
} from './entities';

// =============================================================================
// PLAN DTOs
// =============================================================================

export class CreatePlanDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  metadataId: string;

  @ApiPropertyOptional({ default: '1.0.0' })
  @IsOptional()
  @IsString()
  schemaVersion?: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({ default: 'MXN' })
  @IsOptional()
  @IsString()
  baseCurrency?: string;

  @ApiProperty({ example: '2024-01-01', format: 'date' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({
    example: '2024-12-31',
    format: 'date',
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsDateString()
  endDate?: string | null;

  @ApiPropertyOptional({ enum: PlanStatus, default: PlanStatus.Active })
  @IsOptional()
  @IsEnum(PlanStatus)
  status?: PlanStatus;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  objective?: string | null;

  @ApiPropertyOptional({
    example: '2026-08-01',
    format: 'date',
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsDateString()
  projectedDebtFreeDate?: string | null;

  @ApiPropertyOptional({ minimum: 0, nullable: true, type: Number })
  @IsOptional()
  @IsInt()
  @Min(0)
  projectedEmergencyFundCents?: number | null;
}

export class UpdatePlanDto extends PartialType(CreatePlanDto) {}

export class PlanResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  metadataId: string;

  @ApiProperty()
  schemaVersion: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  baseCurrency: string;

  @ApiProperty({ format: 'date' })
  startDate: string;

  @ApiProperty({ format: 'date', nullable: true, type: String })
  endDate: string | null;

  @ApiProperty({ enum: PlanStatus })
  status: PlanStatus;

  @ApiProperty({ nullable: true, type: String })
  objective: string | null;

  @ApiProperty({ format: 'date', nullable: true, type: String })
  projectedDebtFreeDate: string | null;

  @ApiProperty({ nullable: true, type: Number })
  projectedEmergencyFundCents: number | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

// =============================================================================
// CATEGORY DTOs
// =============================================================================

export class CreateCategoryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ minimum: 0, maximum: 10000 })
  @IsInt()
  @Min(0)
  @Max(10000)
  idealPercentageBps: number;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class CategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  idealPercentageBps: number;

  @ApiProperty({ nullable: true, type: String })
  description: string | null;

  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  archivedAt: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

// =============================================================================
// ACCOUNT DTOs
// =============================================================================

export class CreateAccountDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: FinancialAccountType })
  @IsEnum(FinancialAccountType)
  accountType: FinancialAccountType;

  @ApiPropertyOptional({ default: 'MXN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ minimum: 0, nullable: true, type: Number })
  @IsOptional()
  @IsInt()
  @Min(0)
  openingBalanceCents?: number | null;

  @ApiPropertyOptional({
    example: '2024-01-15T00:00:00.000Z',
    format: 'date-time',
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsDateString()
  openingBalanceObservedAt?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  externalSource?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  externalId?: string | null;
}

export class UpdateAccountDto extends PartialType(CreateAccountDto) {}

export class AccountResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: FinancialAccountType })
  accountType: FinancialAccountType;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: FinancialAccountStatus })
  status: FinancialAccountStatus;

  @ApiProperty({ nullable: true, type: String })
  externalSource: string | null;

  @ApiProperty({ nullable: true, type: String })
  externalId: string | null;

  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  archivedAt: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

export class BalanceSnapshotResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ format: 'date-time' })
  observedAt: string;

  @ApiProperty({ minimum: 0 })
  balanceCents: number;

  @ApiProperty({ enum: SnapshotSource })
  source: SnapshotSource;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;
}

export class CurrentBalanceResponseDto {
  @ApiProperty()
  accountId: string;

  @ApiProperty()
  accountName: string;

  @ApiProperty()
  balanceCents: number;

  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  lastSnapshotAt: string | null;
}

// =============================================================================
// INCOME DTOs
// =============================================================================

export class CreateIncomeSourceDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ default: 'MXN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  defaultDepositAccountId?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateIncomeSourceDto extends PartialType(CreateIncomeSourceDto) {}

export class IncomeSourceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  currency: string;

  @ApiProperty({ nullable: true, type: String })
  defaultDepositAccountId: string | null;

  @ApiProperty()
  active: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

export class CreateIncomeScheduleDto {
  @ApiProperty({ enum: IncomeCadence })
  @IsEnum(IncomeCadence)
  cadence: IncomeCadence;

  @ApiProperty({ example: '2024-01-15', format: 'date' })
  @IsDateString()
  anchorPaymentDate: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  recurrenceRule?: string | null;

  @ApiPropertyOptional({
    example: '2024-12-31',
    format: 'date',
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsDateString()
  generatedThrough?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateIncomeScheduleDto extends PartialType(
  CreateIncomeScheduleDto,
) {}

export class IncomeScheduleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: IncomeCadence })
  cadence: IncomeCadence;

  @ApiProperty({ format: 'date' })
  anchorPaymentDate: string;

  @ApiProperty({ nullable: true, type: String })
  recurrenceRule: string | null;

  @ApiProperty({ format: 'date', nullable: true, type: String })
  generatedThrough: string | null;

  @ApiProperty()
  active: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

export class CreateIncomeScheduleAmountRuleDto {
  @ApiProperty({ minimum: 1, nullable: true, type: Number })
  @IsOptional()
  @IsInt()
  @Min(1)
  paymentNumberInMonth?: number | null;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  amountCents: number;

  @ApiPropertyOptional({
    example: '2024-01-01',
    format: 'date',
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsDateString()
  validFrom?: string | null;

  @ApiPropertyOptional({
    example: '2024-12-31',
    format: 'date',
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsDateString()
  validUntil?: string | null;
}

export class UpdateIncomeScheduleAmountRuleDto extends PartialType(
  CreateIncomeScheduleAmountRuleDto,
) {}

export class IncomeScheduleAmountRuleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true, type: Number })
  paymentNumberInMonth: number | null;

  @ApiProperty()
  amountCents: number;

  @ApiProperty({ format: 'date', nullable: true, type: String })
  validFrom: string | null;

  @ApiProperty({ format: 'date', nullable: true, type: String })
  validUntil: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

export class CreateIncomePaymentDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  incomeSourceId: string;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  incomeScheduleId?: string | null;

  @ApiProperty({ example: '2024-01-15', format: 'date' })
  @IsDateString()
  paidOn: string;

  @ApiPropertyOptional({ minimum: 1, nullable: true, type: Number })
  @IsOptional()
  @IsInt()
  @Min(1)
  paymentNumberInMonth?: number | null;

  @ApiPropertyOptional({ enum: IncomePaymentStatus })
  @IsOptional()
  @IsEnum(IncomePaymentStatus)
  status?: IncomePaymentStatus;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  externalSource?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  externalId?: string | null;
}

export class UpdateIncomePaymentDto extends PartialType(
  CreateIncomePaymentDto,
) {}

export class IncomePaymentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  incomeSourceId: string;

  @ApiProperty({ nullable: true, type: String })
  incomeScheduleId: string | null;

  @ApiProperty({ nullable: true, type: String })
  transactionId: string | null;

  @ApiProperty({ format: 'date' })
  paidOn: string;

  @ApiProperty({ nullable: true, type: Number })
  paymentNumberInMonth: number | null;

  @ApiProperty({ enum: IncomePaymentStatus })
  status: IncomePaymentStatus;

  @ApiProperty({ nullable: true, type: String })
  externalSource: string | null;

  @ApiProperty({ nullable: true, type: String })
  externalId: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

// =============================================================================
// TRANSACTION DTOs
// =============================================================================

export class CreateBudgetAllocationDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  budgetItemId: string;

  @ApiProperty()
  @IsInt()
  @Min(0)
  allocatedAmountCents: number;
}

export class CreateTransactionEntryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  accountId: string;

  @ApiProperty()
  @IsInt()
  amountCents: number;
}

export class CreateTransactionDto {
  @ApiProperty({ example: '2024-01-15', format: 'date-time' })
  @IsDateString()
  occurredAt: string;

  @ApiProperty({ enum: TransactionType })
  @IsEnum(TransactionType)
  transactionType: TransactionType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ enum: TransactionStatus })
  @IsOptional()
  @IsEnum(TransactionStatus)
  status?: TransactionStatus;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiProperty({ type: [CreateTransactionEntryDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateTransactionEntryDto)
  entries: CreateTransactionEntryDto[];

  @ApiPropertyOptional({ type: [CreateBudgetAllocationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateBudgetAllocationDto)
  budgetAllocations?: CreateBudgetAllocationDto[];
}

export class UpdateTransactionDto extends PartialType(CreateTransactionDto) {}

export class TransactionResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ format: 'date-time' })
  occurredAt: string;

  @ApiProperty({ enum: TransactionType })
  transactionType: TransactionType;

  @ApiProperty()
  description: string;

  @ApiProperty({ enum: TransactionStatus })
  status: TransactionStatus;

  @ApiProperty({ nullable: true, type: String })
  categoryId: string | null;

  @ApiProperty({ nullable: true, type: String })
  notes: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

export class TransactionEntryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  accountId: string;

  @ApiProperty()
  amountCents: number;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;
}

// =============================================================================
// BUDGET DTOs
// =============================================================================

export class CreateBudgetPeriodDto {
  @ApiProperty({ enum: BudgetPeriodType })
  @IsEnum(BudgetPeriodType)
  periodType: BudgetPeriodType;

  @ApiProperty({ example: '2024-01-01', format: 'date' })
  @IsDateString()
  startsOn: string;

  @ApiProperty({ example: '2024-01-31', format: 'date' })
  @IsDateString()
  endsOn: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  fundingAmountCents: number;

  @ApiPropertyOptional({ enum: BudgetPeriodStatus })
  @IsOptional()
  @IsEnum(BudgetPeriodStatus)
  status?: BudgetPeriodStatus;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  incomePaymentId?: string | null;
}

export class UpdateBudgetPeriodDto extends PartialType(CreateBudgetPeriodDto) {}

export class BudgetPeriodResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: BudgetPeriodType })
  periodType: BudgetPeriodType;

  @ApiProperty({ format: 'date' })
  startsOn: string;

  @ApiProperty({ format: 'date' })
  endsOn: string;

  @ApiProperty()
  fundingAmountCents: number;

  @ApiProperty()
  plannedTotalCents: number;

  @ApiProperty()
  unallocatedCents: number;

  @ApiProperty({ enum: BudgetPeriodStatus })
  status: BudgetPeriodStatus;

  @ApiProperty({ nullable: true, type: String })
  incomePaymentId: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

export class CreateBudgetItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  concept: string;

  @ApiProperty({ example: '2024-01-20', format: 'date' })
  @IsDateString()
  dueOn: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  plannedAmountCents: number;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  sourceAccountId?: string | null;

  @ApiPropertyOptional({ enum: BudgetItemStatus })
  @IsOptional()
  @IsEnum(BudgetItemStatus)
  status?: BudgetItemStatus;

  @ApiPropertyOptional({ enum: RolloverPolicy })
  @IsOptional()
  @IsEnum(RolloverPolicy)
  rolloverPolicy?: RolloverPolicy;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  notes?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  recurringItemId?: string | null;
}

export class UpdateBudgetItemDto extends PartialType(CreateBudgetItemDto) {}

export class BudgetItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  budgetPeriodId: string;

  @ApiProperty({ nullable: true, type: String })
  recurringItemId: string | null;

  @ApiProperty({ nullable: true, type: String })
  categoryId: string | null;

  @ApiProperty({ nullable: true, type: String })
  sourceAccountId: string | null;

  @ApiProperty({ nullable: true, type: String })
  destinationAccountId: string | null;

  @ApiProperty({ format: 'date' })
  dueOn: string;

  @ApiProperty()
  concept: string;

  @ApiProperty()
  plannedAmountCents: number;

  @ApiProperty({ enum: BudgetItemStatus })
  status: BudgetItemStatus;

  @ApiProperty({ enum: RolloverPolicy })
  rolloverPolicy: RolloverPolicy;

  @ApiProperty({ nullable: true, type: String })
  notes: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

// =============================================================================
// RECURRING ITEM DTOs
// =============================================================================

export class CreateRecurringItemDto {
  @ApiProperty({ enum: RecurringItemType })
  @IsEnum(RecurringItemType)
  itemType: RecurringItemType;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  concept: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  amountCents: number;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  recurrenceRule: string;

  @ApiPropertyOptional({
    example: '2024-01-01',
    format: 'date',
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsDateString()
  startsOn?: string | null;

  @ApiPropertyOptional({
    example: '2024-12-31',
    format: 'date',
    nullable: true,
    type: String,
  })
  @IsOptional()
  @IsDateString()
  endsOn?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  categoryId?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  sourceAccountId?: string | null;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  destinationAccountId?: string | null;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  @IsBoolean()
  active?: boolean;
}

export class UpdateRecurringItemDto extends PartialType(
  CreateRecurringItemDto,
) {}

export class RecurringItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: RecurringItemType })
  itemType: RecurringItemType;

  @ApiProperty()
  concept: string;

  @ApiProperty()
  amountCents: number;

  @ApiProperty()
  recurrenceRule: string;

  @ApiProperty({ format: 'date', nullable: true, type: String })
  startsOn: string | null;

  @ApiProperty({ format: 'date', nullable: true, type: String })
  endsOn: string | null;

  @ApiProperty({ format: 'date', nullable: true, type: String })
  lastGeneratedOn: string | null;

  @ApiProperty({ nullable: true, type: String })
  categoryId: string | null;

  @ApiProperty({ nullable: true, type: String })
  sourceAccountId: string | null;

  @ApiProperty({ nullable: true, type: String })
  destinationAccountId: string | null;

  @ApiProperty()
  active: boolean;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

// =============================================================================
// DEBT PROJECTION DTOs
// =============================================================================

export class CreateDebtProjectionRunDto {
  @ApiProperty({ example: '2024-01-01', format: 'date' })
  @IsDateString()
  projectedFrom: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  algorithmVersion: string;
}

export class DebtProjectionRunResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ format: 'date' })
  projectedFrom: string;

  @ApiProperty({ format: 'date-time' })
  generatedAt: string;

  @ApiProperty()
  algorithmVersion: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;
}

export class DebtProjectionPointResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  projectionRunId: string;

  @ApiProperty()
  accountId: string;

  @ApiProperty({ format: 'date' })
  projectedOn: string;

  @ApiProperty()
  balanceCents: number;
}

// =============================================================================
// PLAN SETTINGS DTOs
// =============================================================================

export class UpsertPlanSettingDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  valueJson: string;
}

export class PlanSettingResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  valueJson: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

// =============================================================================
// SUMMARY NOTE DTOs
// =============================================================================

export class CreateSummaryNoteDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  note: string;
}

export class UpdateSummaryNoteDto extends PartialType(CreateSummaryNoteDto) {}

export class SummaryNoteResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  note: string;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

// =============================================================================
// DASHBOARD / MISC DTOs
// =============================================================================

export class IdResponseDto {
  @ApiProperty()
  id: string;
}

export class SuccessResponseDto {
  @ApiProperty()
  success: boolean;
}

export class DashboardResponseDto {
  @ApiProperty()
  plan: PlanResponseDto;

  @ApiProperty({ type: [AccountResponseDto] })
  accounts: AccountResponseDto[];

  @ApiProperty({ type: [CategoryResponseDto] })
  categories: CategoryResponseDto[];

  @ApiProperty({ type: [CurrentBalanceResponseDto] })
  currentBalances: CurrentBalanceResponseDto[];

  @ApiProperty({ type: [IncomePaymentResponseDto] })
  recentIncomePayments: IncomePaymentResponseDto[];

  @ApiProperty({ type: [TransactionResponseDto] })
  recentTransactions: TransactionResponseDto[];

  @ApiProperty({ type: [RecurringItemResponseDto] })
  recurringItems: RecurringItemResponseDto[];
}
