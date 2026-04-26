import { ApiPropertyOptional } from "@nestjs/swagger";
import { ComplaintContactType } from "@saqbol/db";
import { Transform, Type } from "class-transformer";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min, IsUUID } from "class-validator";

export class ListAdminBlacklistDto {
  @ApiPropertyOptional({
    enum: ComplaintContactType
  })
  @IsOptional()
  @IsEnum(ComplaintContactType)
  type?: ComplaintContactType;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUUID()
  fraudTypeId?: string;

  @ApiPropertyOptional({
    example: true
  })
  @IsOptional()
  @Transform(({ value }) => value === "true" || value === true)
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    example: "bank"
  })
  @IsOptional()
  @IsString()
  search?: string;

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
