import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { IncomeCadence, IncomePaymentStatus } from '../entities';

// =============================================================================
// INCOME SOURCE DTOs
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

// =============================================================================
// INCOME SCHEDULE DTOs
// =============================================================================

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

// =============================================================================
// INCOME SCHEDULE AMOUNT RULE DTOs
// =============================================================================

export class CreateIncomeScheduleAmountRuleDto {
  @ApiProperty({ minimum: 1, nullable: true, type: Number })
  @IsOptional()
  @IsInt()
  @Min(1)
  paymentNumberInMonth?: number | null;

  @ApiProperty({ minimum: 0, type: Number })
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

// =============================================================================
// INCOME PAYMENT DTOs
// =============================================================================

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
