import { ApiPropertyOptional } from "@nestjs/swagger";
import { ComplaintContactType } from "@saqbol/db";
import { Type } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";

export class ListMyCheckHistoryDto {
  @ApiPropertyOptional({
    enum: ComplaintContactType
  })
  @IsOptional()
  @IsEnum(ComplaintContactType)
  type?: ComplaintContactType;

  @ApiPropertyOptional({
    example: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    example: 20
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}
