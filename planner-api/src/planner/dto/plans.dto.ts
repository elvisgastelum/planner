import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

import { PlanStatus } from '../entities';

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
