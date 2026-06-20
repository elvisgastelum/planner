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

import { RecurringItemType } from '../entities';

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
