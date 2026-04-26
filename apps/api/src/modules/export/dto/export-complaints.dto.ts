import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ComplaintStatus } from "@saqbol/db";
import { IsEnum, IsISO8601, IsOptional, IsUUID } from "class-validator";

export enum ComplaintExportFormat {
  CSV = "CSV",
  XLSX = "XLSX"
}

export class ExportComplaintsDto {
  @ApiProperty({ enum: ComplaintExportFormat, example: ComplaintExportFormat.CSV })
  @IsEnum(ComplaintExportFormat)
  format!: ComplaintExportFormat;

  @ApiPropertyOptional({ enum: ComplaintStatus })
  @IsOptional()
  @IsEnum(ComplaintStatus)
  status?: ComplaintStatus;

  @ApiPropertyOptional({ example: "11111111-1111-1111-1111-111111111111" })
  @IsOptional()
  @IsUUID()
  regionId?: string;

  @ApiPropertyOptional({ example: "22222222-2222-2222-2222-222222222222" })
  @IsOptional()
  @IsUUID()
  fraudTypeId?: string;

  @ApiPropertyOptional({ example: "2026-01-01T00:00:00.000Z" })
  @IsOptional()
  @IsISO8601()
  dateFrom?: string;

  @ApiPropertyOptional({ example: "2026-12-31T23:59:59.999Z" })
  @IsOptional()
  @IsISO8601()
  dateTo?: string;
}
