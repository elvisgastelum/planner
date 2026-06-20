import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

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
