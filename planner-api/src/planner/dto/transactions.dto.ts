import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
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
  Min,
  ValidateNested,
} from 'class-validator';

import { TransactionStatus, TransactionType } from '../entities';

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
