import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { RegionKind } from "@saqbol/db";
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateRegionDto {
  @ApiProperty({ example: "astana" })
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiProperty({ enum: RegionKind, example: RegionKind.CITY })
  @IsEnum(RegionKind)
  kind!: RegionKind;

  @ApiProperty({ example: "Астана" })
  @IsString()
  @MaxLength(255)
  nameRu!: string;

  @ApiPropertyOptional({ example: "Астана" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nameKz?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
