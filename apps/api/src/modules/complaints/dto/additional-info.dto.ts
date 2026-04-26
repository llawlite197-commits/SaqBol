import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsOptional,
  IsString,
  ValidateNested
} from "class-validator";
import { ComplaintContactDto } from "./complaint-contact.dto";

export class AdditionalInfoDto {
  @ApiProperty({
    example: "Прикладываю уточнение по звонку и новый номер карты."
  })
  @IsString()
  message!: string;

  @ApiProperty({
    type: [ComplaintContactDto],
    required: false
  })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => ComplaintContactDto)
  contacts?: ComplaintContactDto[];
}
