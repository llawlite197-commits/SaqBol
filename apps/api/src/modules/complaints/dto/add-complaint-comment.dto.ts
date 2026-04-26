import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { CommentVisibility } from "@saqbol/db";
import { IsEnum, IsOptional, IsString, MaxLength } from "class-validator";

export class AddComplaintCommentDto {
  @ApiProperty({
    example: "Требуется дополнительная проверка по номеру телефона."
  })
  @IsString()
  @MaxLength(4000)
  text!: string;

  @ApiPropertyOptional({
    enum: CommentVisibility,
    default: CommentVisibility.INTERNAL
  })
  @IsOptional()
  @IsEnum(CommentVisibility)
  visibility?: CommentVisibility = CommentVisibility.INTERNAL;
}
