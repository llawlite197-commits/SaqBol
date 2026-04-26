import { ApiProperty } from "@nestjs/swagger";
import { IsString, MinLength } from "class-validator";

export class LoginDto {
  @ApiProperty({
    example: "citizen@saqbol.local"
  })
  @IsString()
  login!: string;

  @ApiProperty({
    example: "Citizen123!Secure"
  })
  @IsString()
  @MinLength(8)
  password!: string;
}
