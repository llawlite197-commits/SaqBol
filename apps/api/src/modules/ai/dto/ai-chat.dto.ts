import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class AiChatDto {
  @ApiProperty({
    example: "Мне пришло SMS: ваша карта заблокирована, перейдите по ссылке..."
  })
  @IsString()
  @MinLength(2)
  @MaxLength(4000)
  message!: string;

  @ApiPropertyOptional({
    enum: ["public", "workspace"],
    default: "public"
  })
  @IsOptional()
  @IsIn(["public", "workspace"])
  context?: "public" | "workspace";
}
