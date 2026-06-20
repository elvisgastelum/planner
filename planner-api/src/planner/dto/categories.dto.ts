import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateCategoryDto {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  code: string;

  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ minimum: 0, maximum: 10000 })
  @IsInt()
  @Min(0)
  @Max(10000)
  idealPercentageBps: number;

  @ApiPropertyOptional({ nullable: true, type: String })
  @IsOptional()
  @IsString()
  description?: string | null;
}

export class UpdateCategoryDto extends PartialType(CreateCategoryDto) {}

export class CategoryResponseDto {
  @ApiProperty()
  id: string;

  @ApiProperty()
  code: string;

  @ApiProperty()
  name: string;

  @ApiProperty()
  idealPercentageBps: number;

  @ApiProperty({ nullable: true, type: String })
  description: string | null;

  @ApiProperty({ format: 'date-time', nullable: true, type: String })
  archivedAt: string | null;

  @ApiProperty({ format: 'date-time' })
  createdAt: string;

  @ApiProperty({ format: 'date-time' })
  updatedAt: string;
}
