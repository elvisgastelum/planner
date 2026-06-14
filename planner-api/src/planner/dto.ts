import {
  ApiExtraModels,
  ApiProperty,
  ApiPropertyOptional,
  getSchemaPath,
  PartialType,
} from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
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
  AccountType,
  IncomeCadence,
  IncomeGenerationMethod,
  IncomeSource,
  IncomeStatus,
  ItemStatus,
  PlanStatus,
  RecurringExpenseDayRule,
  RecurringFrequency,
} from './entities';

export class CreateFinancialPlanDto {
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
  currency?: string;

  @ApiProperty({ example: '2026-06-11', format: 'date' })
  @IsDateString()
  startDate: string;

  @ApiPropertyOptional({
    example: '2026-08-14',
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
}

export class UpdateFinancialPlanDto extends PartialType(
  CreateFinancialPlanDto,
) {}

export class CreateAccountDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  externalId: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ enum: AccountType })
  @IsEnum(AccountType)
  type: AccountType;
}

export class UpdateAccountDto extends PartialType(CreateAccountDto) {}

export class CreateAllocationCategoryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  key: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ minimum: 0, maximum: 100 })
  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class UpdateAllocationCategoryDto extends PartialType(
  CreateAllocationCategoryDto,
) {}

export class IncomeAmountRuleDto {
  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  paymentNumberInMonth: number;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ default: 'MXN' })
  @IsOptional()
  @IsString()
  currency?: string;
}

export class CreateIncomeScheduleDto {
  @ApiProperty({ enum: IncomeCadence })
  @IsEnum(IncomeCadence)
  cadence: IncomeCadence;

  @ApiProperty({ example: '2026-06-19', format: 'date' })
  @IsDateString()
  anchorPaymentDate: string;

  @ApiPropertyOptional({ default: 'MXN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  ordinaryMonthGrossIncome?: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  ordinaryMonthNetReference?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  calculationRule?: string;

  @ApiProperty({ type: [IncomeAmountRuleDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => IncomeAmountRuleDto)
  amountRules: IncomeAmountRuleDto[];
}

export class UpdateIncomeScheduleDto extends PartialType(
  CreateIncomeScheduleDto,
) {}

export class GenerateIncomePaymentsDto {
  @ApiProperty({ example: '2027-12-31', format: 'date' })
  @IsDateString()
  through: string;
}

export class CreateIncomePaymentDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiProperty({ example: '2026-07-31', format: 'date' })
  @IsDateString()
  date: string;

  @ApiPropertyOptional({
    example: '2026-07',
    pattern: '^\\d{4}-(0[1-9]|1[0-2])$',
  })
  @IsOptional()
  @IsString()
  @Matches(/^\d{4}-(0[1-9]|1[0-2])$/)
  month?: string;

  @ApiProperty({ minimum: 1 })
  @IsInt()
  @Min(1)
  paymentNumberInMonth: number;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional({ default: 'MXN' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ enum: IncomeStatus })
  @IsOptional()
  @IsEnum(IncomeStatus)
  status?: IncomeStatus;

  @ApiPropertyOptional({ enum: IncomeSource })
  @IsOptional()
  @IsEnum(IncomeSource)
  source?: IncomeSource;
}

export class UpdateIncomePaymentDto extends PartialType(
  CreateIncomePaymentDto,
) {}

export class CreatePaymentPeriodDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  incomePaymentId?: string;

  @ApiProperty({ example: '2026-07-31', format: 'date' })
  @IsDateString()
  incomeDate: string;
}

export class UpdatePaymentPeriodDto extends PartialType(
  CreatePaymentPeriodDto,
) {}

export class CreatePaymentPeriodItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiProperty({ example: '2026-07-31', format: 'date' })
  @IsDateString()
  date: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  concept: string;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  plannedAmount: number;

  @ApiPropertyOptional({ minimum: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  actualAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  account?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fundingAccount?: string;

  @ApiPropertyOptional({ enum: ItemStatus })
  @IsOptional()
  @IsEnum(ItemStatus)
  status?: ItemStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePaymentPeriodItemDto extends PartialType(
  CreatePaymentPeriodItemDto,
) {}

export class CompletePaymentPeriodItemDto {
  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  actualAmount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CreateRecurringExpenseDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  concept: string;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiProperty({ enum: RecurringFrequency })
  @IsEnum(RecurringFrequency)
  frequency: RecurringFrequency;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  @Min(1)
  day?: number;

  @ApiPropertyOptional({ type: [Number] })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  days?: number[];

  @ApiPropertyOptional({ example: '2026-07-31', format: 'date' })
  @IsOptional()
  @IsDateString()
  date?: string;

  @ApiPropertyOptional({ enum: RecurringExpenseDayRule })
  @IsOptional()
  @IsEnum(RecurringExpenseDayRule)
  dayRule?: RecurringExpenseDayRule;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  account?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fundingAccount?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;
}

export class UpdateRecurringExpenseDto extends PartialType(
  CreateRecurringExpenseDto,
) {}

export class CreateCompletedItemDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  externalId?: string;

  @ApiProperty({ example: '2026-07-31', format: 'date' })
  @IsDateString()
  date: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  concept: string;

  @ApiProperty({ minimum: 0 })
  @IsNumber()
  @Min(0)
  amount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  account?: string;
}

export class UpdateCompletedItemDto extends PartialType(
  CreateCompletedItemDto,
) {}

export class ImportPlanJsonDto {
  @ApiPropertyOptional({
    description:
      'Optional override path. Defaults to src/plan-financiero.json.',
  })
  @IsOptional()
  @IsString()
  path?: string;
}

export enum PlanRuleKey {
  IncomeSchedule = 'income_schedule',
  ChildrenBuffer = 'children_buffer',
  WeeklyFlexibleBudget = 'weekly_flexible_budget',
  CreditCardBacking = 'credit_card_backing',
  DebtLiquidation = 'debt_liquidation',
}

export class IncomeScheduleRuleMonthlyDeductionsReferenceDto {
  @ApiProperty()
  accountant: number;

  @ApiProperty()
  taxes: number;
}

export class IncomeScheduleRuleValueDto {
  @ApiProperty()
  cadence: string;

  @ApiProperty({ example: '2026-06-19', format: 'date' })
  anchor_payment_date: string;

  @ApiProperty()
  currency: string;

  @ApiProperty({ type: 'object', additionalProperties: { type: 'number' } })
  monthly_payment_amounts: Record<string, number>;

  @ApiProperty()
  calculation_rule: string;

  @ApiProperty({ minimum: 0 })
  ordinary_month_gross_income: number;

  @ApiProperty({ type: IncomeScheduleRuleMonthlyDeductionsReferenceDto })
  monthly_deductions_reference: IncomeScheduleRuleMonthlyDeductionsReferenceDto;

  @ApiProperty({ minimum: 0 })
  ordinary_month_net_reference: number;
}

export class IncomeScheduleRuleDto {
  @ApiProperty({ enum: [PlanRuleKey.IncomeSchedule] })
  key: PlanRuleKey.IncomeSchedule;

  @ApiProperty({ type: IncomeScheduleRuleValueDto })
  valueJson: IncomeScheduleRuleValueDto;
}

export class ChildrenBufferRuleValueDto {
  @ApiProperty({ minimum: 0 })
  amount_per_payment_period: number;

  @ApiProperty()
  category: string;

  @ApiProperty()
  purpose: string;

  @ApiProperty()
  rollover: boolean;

  @ApiProperty()
  treated_as_spent_if_unused: boolean;

  @ApiProperty()
  reusable_for_debt: boolean;

  @ApiProperty()
  reusable_for_savings: boolean;
}

export class ChildrenBufferRuleDto {
  @ApiProperty({ enum: [PlanRuleKey.ChildrenBuffer] })
  key: PlanRuleKey.ChildrenBuffer;

  @ApiProperty({ type: ChildrenBufferRuleValueDto })
  valueJson: ChildrenBufferRuleValueDto;
}

export class WeeklyFlexibleBudgetRuleValueDto {
  @ApiProperty({ minimum: 0 })
  amount_per_week: number;

  @ApiProperty()
  category: string;

  @ApiProperty({ example: '2026-06-19', format: 'date' })
  starts_on: string;

  @ApiProperty()
  reducible_for_debt: boolean;

  @ApiProperty({ type: [String] })
  purpose: string[];
}

export class WeeklyFlexibleBudgetRuleDto {
  @ApiProperty({ enum: [PlanRuleKey.WeeklyFlexibleBudget] })
  key: PlanRuleKey.WeeklyFlexibleBudget;

  @ApiProperty({ type: WeeklyFlexibleBudgetRuleValueDto })
  valueJson: WeeklyFlexibleBudgetRuleValueDto;
}

export class CreditCardBackingRuleValueDto {
  @ApiProperty()
  funding_account: string;

  @ApiProperty()
  policy: string;
}

export class CreditCardBackingRuleDto {
  @ApiProperty({ enum: [PlanRuleKey.CreditCardBacking] })
  key: PlanRuleKey.CreditCardBacking;

  @ApiProperty({ type: CreditCardBackingRuleValueDto })
  valueJson: CreditCardBackingRuleValueDto;
}

export class DebtLiquidationRuleValueDto {
  @ApiProperty()
  replace_estimated_amount_with_real_balance_on_payment_date: boolean;

  @ApiProperty({ type: [String] })
  priority: string[];
}

export class DebtLiquidationRuleDto {
  @ApiProperty({ enum: [PlanRuleKey.DebtLiquidation] })
  key: PlanRuleKey.DebtLiquidation;

  @ApiProperty({ type: DebtLiquidationRuleValueDto })
  valueJson: DebtLiquidationRuleValueDto;
}

export type PlanRuleResponseDto =
  | IncomeScheduleRuleDto
  | ChildrenBufferRuleDto
  | WeeklyFlexibleBudgetRuleDto
  | CreditCardBackingRuleDto
  | DebtLiquidationRuleDto;

export class DeleteResultDto {
  @ApiProperty()
  deleted: boolean;
}

export class FinancialPlanResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  metadataId: string;

  @ApiProperty()
  schemaVersion: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  currency: string;

  @ApiProperty({ example: '2026-06-11', format: 'date' })
  startDate: string;

  @ApiProperty({
    example: '2026-08-14',
    format: 'date',
    nullable: true,
    type: String,
  })
  endDate: string | null;

  @ApiProperty({ enum: PlanStatus })
  status: PlanStatus;

  @ApiProperty({ nullable: true, type: String })
  objective: string | null;

  @ApiProperty({
    example: '2027-12-31',
    format: 'date',
    nullable: true,
    type: String,
  })
  projectedDebtFreeDate: string | null;

  @ApiProperty({ nullable: true, type: Number })
  projectedEmergencyFund: number | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}

export class PlanOverviewResponseDto extends FinancialPlanResponseDto {
  @ApiProperty()
  plannedTotal: number;

  @ApiProperty()
  plannedRemaining: number;

  @ApiProperty()
  completedTotal: number;

  @ApiProperty()
  accountsCount: number;

  @ApiProperty()
  incomePaymentsCount: number;

  @ApiProperty()
  paymentPeriodsCount: number;

  @ApiProperty()
  recurringExpensesCount: number;

  @ApiProperty()
  completedItemsCount: number;

  @ApiProperty({
    example: '2026-07-31',
    format: 'date',
    nullable: true,
    type: String,
  })
  nextIncomeDate: string | null;
}

export class PlanEditFormResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  metadataId: string;

  @ApiProperty()
  schemaVersion: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  currency: string;

  @ApiProperty({ example: '2026-06-11', format: 'date' })
  startDate: string;

  @ApiProperty({
    example: '2026-08-14',
    format: 'date',
    nullable: true,
    type: String,
  })
  endDate: string | null;

  @ApiProperty({ enum: PlanStatus })
  status: PlanStatus;

  @ApiProperty({ nullable: true, type: String })
  objective: string | null;
}

export class AllocationCategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  key: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  percentage: number;

  @ApiProperty({ nullable: true, type: String })
  description: string | null;
}

export class AccountResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  externalId: string;

  @ApiProperty()
  name: string;

  @ApiProperty({ enum: AccountType })
  type: AccountType;
}

export class AllocationCategoryReferenceResponseDto {
  @ApiProperty({ nullable: true, type: String })
  categoryId: string | null;
}

export class AccountReferenceResponseDto extends AllocationCategoryReferenceResponseDto {
  @ApiProperty({ nullable: true, type: String })
  accountId: string | null;

  @ApiProperty({ nullable: true, type: String })
  fundingAccountId: string | null;
}

export class IncomeAmountRuleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  paymentNumberInMonth: number;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;
}

export class IncomeScheduleResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ enum: IncomeCadence })
  cadence: IncomeCadence;

  @ApiProperty({ example: '2026-06-19', format: 'date' })
  anchorPaymentDate: string;

  @ApiProperty()
  currency: string;

  @ApiProperty({ nullable: true, type: Number })
  ordinaryMonthGrossIncome: number | null;

  @ApiProperty({ nullable: true, type: Number })
  ordinaryMonthNetReference: number | null;

  @ApiProperty({
    example: '2027-12-31',
    format: 'date',
    nullable: true,
    type: String,
  })
  generatedThrough: string | null;

  @ApiProperty({ enum: IncomeGenerationMethod, nullable: true, type: String })
  generationMethod: IncomeGenerationMethod | null;

  @ApiProperty({ nullable: true, type: String })
  calculationRule: string | null;

  @ApiProperty({ type: [IncomeAmountRuleResponseDto] })
  amountRules: IncomeAmountRuleResponseDto[];
}

export class IncomePaymentResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true, type: String })
  externalId: string | null;

  @ApiProperty({ example: '2026-07-31', format: 'date' })
  date: string;

  @ApiProperty({
    example: '2026-07',
    pattern: '^\\d{4}-(0[1-9]|1[0-2])$',
  })
  month: string;

  @ApiProperty()
  paymentNumberInMonth: number;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: IncomeStatus })
  status: IncomeStatus;

  @ApiProperty({ enum: IncomeSource })
  source: IncomeSource;
}

export class IncomePaymentRefResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ example: '2026-07-31', format: 'date' })
  date: string;

  @ApiProperty({
    example: '2026-07',
    pattern: '^\\d{4}-(0[1-9]|1[0-2])$',
  })
  month: string;

  @ApiProperty()
  amount: number;

  @ApiProperty()
  currency: string;

  @ApiProperty({ enum: IncomeStatus })
  status: IncomeStatus;

  @ApiProperty({ enum: IncomeSource })
  source: IncomeSource;
}

export class PaymentPeriodItemResponseDto extends AccountReferenceResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true, type: String })
  externalId: string | null;

  @ApiProperty({ example: '2026-07-31', format: 'date' })
  date: string;

  @ApiProperty()
  concept: string;

  @ApiProperty()
  plannedAmount: number;

  @ApiProperty({ nullable: true, type: Number })
  actualAmount: number | null;

  @ApiProperty({ nullable: true, type: String })
  category: string | null;

  @ApiProperty({ nullable: true, type: String })
  account: string | null;

  @ApiProperty({ nullable: true, type: String })
  fundingAccount: string | null;

  @ApiProperty({ enum: ItemStatus })
  status: ItemStatus;

  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  completedAt: string | null;

  @ApiProperty({ nullable: true, type: String })
  notes: string | null;

  @ApiProperty()
  nonRollover: boolean;

  @ApiProperty()
  treatedAsSpentIfUnused: boolean;
}

export class PaymentPeriodResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true, type: String })
  externalId: string | null;

  @ApiProperty({ example: '2026-07-31', format: 'date' })
  incomeDate: string;

  @ApiProperty()
  plannedTotal: number;

  @ApiProperty()
  plannedRemaining: number;

  @ApiProperty({ type: IncomePaymentResponseDto, nullable: true })
  incomePayment: IncomePaymentResponseDto | null;

  @ApiProperty({ type: [PaymentPeriodItemResponseDto] })
  items: PaymentPeriodItemResponseDto[];
}

export class PaymentPeriodSummaryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true, type: String })
  externalId: string | null;

  @ApiProperty({ example: '2026-07-31', format: 'date' })
  incomeDate: string;

  @ApiProperty()
  plannedTotal: number;

  @ApiProperty()
  plannedRemaining: number;

  @ApiProperty({ type: IncomePaymentRefResponseDto, nullable: true })
  incomePayment: IncomePaymentRefResponseDto | null;

  @ApiProperty()
  itemsCount: number;
}

export class RecurringExpenseDayResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  day: number;
}

export class RecurringExpenseResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  concept: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: RecurringFrequency })
  frequency: RecurringFrequency;

  @ApiProperty({ nullable: true, type: Number })
  day: number | null;

  @ApiProperty({
    example: '2026-07-31',
    format: 'date',
    nullable: true,
    type: String,
  })
  date: string | null;

  @ApiProperty({ enum: RecurringExpenseDayRule, nullable: true, type: String })
  dayRule: RecurringExpenseDayRule | null;

  @ApiProperty({ nullable: true, type: String })
  account: string | null;

  @ApiProperty({ nullable: true, type: String })
  fundingAccount: string | null;

  @ApiProperty({ nullable: true, type: String })
  category: string | null;

  @ApiProperty({ nullable: true, type: String })
  accountId: string | null;

  @ApiProperty({ nullable: true, type: String })
  fundingAccountId: string | null;

  @ApiProperty({ nullable: true, type: String })
  categoryId: string | null;

  @ApiProperty()
  nonRollover: boolean;

  @ApiProperty({
    example: '2026-07-31',
    format: 'date',
    nullable: true,
    type: String,
  })
  lastPaymentDate: string | null;

  @ApiProperty({ nullable: true, type: Number })
  lastPaymentAmount: number | null;

  @ApiProperty({ type: [RecurringExpenseDayResponseDto] })
  days: RecurringExpenseDayResponseDto[];
}

export class RecurringExpenseListResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  concept: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ enum: RecurringFrequency })
  frequency: RecurringFrequency;

  @ApiProperty({ nullable: true, type: Number })
  day: number | null;

  @ApiProperty({ nullable: true, type: String })
  account: string | null;

  @ApiProperty({ nullable: true, type: String })
  fundingAccount: string | null;

  @ApiProperty({ nullable: true, type: String })
  category: string | null;

  @ApiProperty({ type: [RecurringExpenseDayResponseDto] })
  days: RecurringExpenseDayResponseDto[];
}

export class CompletedItemResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty({ nullable: true, type: String })
  externalId: string | null;

  @ApiProperty({ example: '2026-07-31', format: 'date' })
  date: string;

  @ApiProperty()
  concept: string;

  @ApiProperty()
  amount: number;

  @ApiProperty({ nullable: true, type: String })
  type: string | null;

  @ApiProperty({ nullable: true, type: String })
  category: string | null;

  @ApiProperty({ nullable: true, type: String })
  fromAccount: string | null;

  @ApiProperty({ nullable: true, type: String })
  toAccount: string | null;

  @ApiProperty({ nullable: true, type: String })
  account: string | null;

  @ApiProperty({ enum: ItemStatus })
  status: ItemStatus;
}

@ApiExtraModels(
  IncomeScheduleRuleDto,
  ChildrenBufferRuleDto,
  WeeklyFlexibleBudgetRuleDto,
  CreditCardBackingRuleDto,
  DebtLiquidationRuleDto,
)
export class FinancialPlanDetailResponseDto extends FinancialPlanResponseDto {
  @ApiProperty({ type: [AllocationCategoryResponseDto] })
  allocationCategories: AllocationCategoryResponseDto[];

  @ApiProperty({ type: [AccountResponseDto] })
  accounts: AccountResponseDto[];

  @ApiProperty({ type: IncomeScheduleResponseDto, nullable: true })
  incomeSchedule: IncomeScheduleResponseDto | null;

  @ApiProperty({ type: [IncomePaymentResponseDto] })
  incomePayments: IncomePaymentResponseDto[];

  @ApiProperty({ type: [PaymentPeriodResponseDto] })
  paymentPeriods: PaymentPeriodResponseDto[];

  @ApiProperty({ type: [RecurringExpenseResponseDto] })
  recurringExpenses: RecurringExpenseResponseDto[];

  @ApiProperty({ type: [CompletedItemResponseDto] })
  completedItems: CompletedItemResponseDto[];

  @ApiProperty({
    type: 'array',
    items: {
      oneOf: [
        { $ref: getSchemaPath(IncomeScheduleRuleDto) },
        { $ref: getSchemaPath(ChildrenBufferRuleDto) },
        { $ref: getSchemaPath(WeeklyFlexibleBudgetRuleDto) },
        { $ref: getSchemaPath(CreditCardBackingRuleDto) },
        { $ref: getSchemaPath(DebtLiquidationRuleDto) },
      ],
    },
  })
  rules: PlanRuleResponseDto[];
}

export class ImportPlanJsonCountsDto {
  @ApiProperty()
  allocationCategories: number;

  @ApiProperty()
  accounts: number;

  @ApiProperty()
  amountRules: number;

  @ApiProperty()
  completedItems: number;

  @ApiProperty()
  currentAccountBalances: number;

  @ApiProperty()
  currentDebtBalances: number;

  @ApiProperty()
  debtBalances: number;

  @ApiProperty()
  debtSnapshots: number;

  @ApiProperty()
  incomePayments: number;

  @ApiProperty()
  incomeSchedules: number;

  @ApiProperty()
  paymentPeriodItems: number;

  @ApiProperty()
  paymentPeriods: number;

  @ApiProperty()
  preIncomeAllocationItems: number;

  @ApiProperty()
  recurringExpenseDays: number;

  @ApiProperty()
  recurringExpenses: number;

  @ApiProperty()
  rules: number;

  @ApiProperty()
  summaryNotes: number;
}

export class ImportPlanJsonResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  metadataId: string;

  @ApiProperty()
  imported: boolean;

  @ApiProperty({ type: ImportPlanJsonCountsDto })
  counts: ImportPlanJsonCountsDto;
}
