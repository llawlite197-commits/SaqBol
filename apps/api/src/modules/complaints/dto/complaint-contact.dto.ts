import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { ComplaintContactType } from "@saqbol/db";
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class ComplaintContactDto {
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

  @ApiPropertyOptional({
    example: "Основной номер"
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  label?: string;

  @ApiPropertyOptional({
    example: true
  })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}
