import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsBoolean, IsInt, IsOptional, IsString, MaxLength, Min } from "class-validator";

export class CreateFraudTypeDto {
  @ApiProperty({ example: "PHISHING" })
  @IsString()
  @MaxLength(64)
  code!: string;

  @ApiProperty({ example: "Фишинг" })
  @IsString()
  @MaxLength(255)
  nameRu!: string;

  @ApiPropertyOptional({ example: "Фишинг" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  nameKz?: string;

  @ApiPropertyOptional({ example: "Поддельные сайты, письма и сообщения." })
  @IsOptional()
  @IsString()
  descriptionRu?: string;

  @ApiPropertyOptional({ example: "Жалған сайттар, хаттар және хабарламалар." })
  @IsOptional()
  @IsString()
  descriptionKz?: string;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(0)
  sortOrder?: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
