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
  FinancialAccountStatus,
  FinancialAccountType,
  SnapshotSource,
} from '../entities';

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

export class CreateBalanceSnapshotDto {
  @ApiProperty({ minimum: 0, type: Number })
  @IsInt()
  @Min(0)
  balanceCents: number;

  @ApiPropertyOptional({ default: SnapshotSource.Manual, enum: SnapshotSource })
  @IsOptional()
  @IsEnum(SnapshotSource)
  source?: SnapshotSource;
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
