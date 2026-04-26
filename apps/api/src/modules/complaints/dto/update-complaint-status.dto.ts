import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ComplaintStatus } from "@saqbol/db";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class UpdateComplaintStatusDto {
  @ApiProperty({
    enum: ComplaintStatus
  })
  @IsEnum(ComplaintStatus)
  status!: ComplaintStatus;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(100)
  reasonCode?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(4000)
  reasonText?: string;
}
