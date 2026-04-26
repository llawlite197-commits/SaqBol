import { ApiPropertyOptional } from "@nestjs/swagger";
import { ExportJobStatus } from "@saqbol/db";
import { Transform } from "class-transformer";
import { IsEnum, IsInt, IsOptional, Max, Min } from "class-validator";

export class ListExportJobsDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ example: 20 })
  @IsOptional()
  @Transform(({ value }) => Number(value))
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({ enum: ExportJobStatus })
  @IsOptional()
  @IsEnum(ExportJobStatus)
  status?: ExportJobStatus;
}
