import { ApiProperty } from "@nestjs/swagger";
import { ComplaintContactType } from "@saqbol/db";
import { IsEnum, IsString, MaxLength } from "class-validator";

export class CheckBlacklistDto {
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
}
