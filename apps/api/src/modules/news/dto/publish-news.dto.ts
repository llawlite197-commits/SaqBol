import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsISO8601, IsOptional } from "class-validator";

export class PublishNewsDto {
  @ApiPropertyOptional({ example: "2026-04-24T10:00:00.000Z" })
  @IsOptional()
  @IsISO8601()
  publishedAt?: string;
}
