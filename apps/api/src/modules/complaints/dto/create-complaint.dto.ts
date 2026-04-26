import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateNested
} from "class-validator";
import { ComplaintContactDto } from "./complaint-contact.dto";

export class CreateComplaintDto {
  @ApiProperty()
  @IsUUID()
  fraudTypeId!: string;

  @ApiProperty()
  @IsUUID()
  regionId!: string;

  @ApiPropertyOptional({
    example: "Подозрительный перевод на карту"
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  title?: string;

  @ApiProperty({
    example: "Мне позвонили от имени банка и попросили перевести деньги."
  })
  @IsString()
  description!: string;

  @ApiPropertyOptional({
    example: "2026-04-22T10:30:00.000Z"
  })
  @IsOptional()
  @IsDateString()
  incidentDate?: string;

  @ApiPropertyOptional({
    example: 250000
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  damageAmount?: number;

  @ApiPropertyOptional({
    type: [ComplaintContactDto]
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ComplaintContactDto)
  contacts?: ComplaintContactDto[];
}
