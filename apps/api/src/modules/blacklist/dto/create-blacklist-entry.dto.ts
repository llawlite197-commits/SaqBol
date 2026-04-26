import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { BlacklistSource, ComplaintContactType } from "@saqbol/db";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsBoolean,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min
} from "class-validator";

export class CreateBlacklistEntryDto {
  @ApiProperty({
    enum: ComplaintContactType
  })
  @IsEnum(ComplaintContactType)
  type!: ComplaintContactType;

  @ApiProperty({
    example: "+77015554433"
  })
  @IsString()
  @MaxLength(2048)
  value!: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  fraudTypeId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @ApiPropertyOptional({
    enum: BlacklistSource,
    default: BlacklistSource.MANUAL
  })
  @IsOptional()
  @IsEnum(BlacklistSource)
  sourceType?: BlacklistSource = BlacklistSource.MANUAL;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  sourceComplaintId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  notes?: string;

  @ApiPropertyOptional({
    example: 80
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(100)
  riskScore?: number;

  @ApiPropertyOptional({
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: "2026-04-24T10:00:00.000Z"
  })
  @IsOptional()
  @IsDateString()
  lastSeenAt?: string;
}
