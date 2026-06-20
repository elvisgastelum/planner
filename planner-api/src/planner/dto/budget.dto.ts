import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import {
  BudgetItemStatus,
  BudgetPeriodStatus,
  BudgetPeriodType,
  RolloverPolicy,
} from '../entities';

// =============================================================================
// BUDGET PERIOD DTOs
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

  @ApiProperty({ minimum: 0, type: Number })
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

// =============================================================================
// BUDGET ITEM DTOs
// =============================================================================

export class CreateBudgetItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  concept: string;

  @ApiProperty({ example: '2024-01-20', format: 'date' })
  @IsDateString()
  dueOn: string;

  @ApiProperty({ minimum: 0, type: Number })
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
// BUDGET ITEM FULFILLMENT DTOs
// =============================================================================

export class FulfillBudgetItemDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  transactionId: string;

  @ApiProperty({ minimum: 0 })
  @IsInt()
  @Min(0)
  allocatedAmountCents: number;
}
