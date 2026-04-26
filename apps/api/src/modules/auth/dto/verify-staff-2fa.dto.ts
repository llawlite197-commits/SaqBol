import { ApiProperty } from "@nestjs/swagger";
import { IsString, Matches } from "class-validator";

export class VerifyStaffTwoFactorDto {
  @ApiProperty({
    example: "8eb4398c-a594-4bf4-9d1d-26f69466e1c0"
  })
  @IsString()
  sessionId!: string;

  @ApiProperty({
    example: "123456"
  })
  @IsString()
  @Matches(/^[0-9]{6}$/)
  code!: string;
}
