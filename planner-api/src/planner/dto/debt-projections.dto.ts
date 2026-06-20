import { ApiProperty } from '@nestjs/swagger';
import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

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
