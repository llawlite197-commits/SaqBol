import { ApiProperty } from "@nestjs/swagger";
import { IsString, MaxLength, MinLength } from "class-validator";

export class AnalyzeUrlDto {
  @ApiProperty({
    example: "https://kaspi-security-check.example.com/login"
  })
  @IsString()
  @MinLength(4)
  @MaxLength(2048)
  url!: string;
}
