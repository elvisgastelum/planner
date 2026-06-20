import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

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
