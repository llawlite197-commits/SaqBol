import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class AnalyzeSmsDto {
  @ApiProperty({
    example: "Kaspi: Ваша карта заблокирована. Срочно перейдите по ссылке http://..."
  })
  @IsString()
  @MinLength(3)
  @MaxLength(2000)
  smsText!: string;
}
