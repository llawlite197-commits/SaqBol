import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { NewsStatus } from "@saqbol/db";
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength, MinLength } from "class-validator";

export class CreateNewsDto {
  @ApiProperty({ example: "Как распознать фишинговую ссылку" })
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  titleRu!: string;

  @ApiPropertyOptional({ example: "Фишинг сілтемесін қалай тануға болады" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  titleKz?: string;

  @ApiPropertyOptional({ example: "kak-raspoznat-fishingovuyu-ssylku" })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  slug?: string;

  @ApiProperty({ example: "Краткое описание новости." })
  @IsString()
  @MinLength(10)
  @MaxLength(500)
  summaryRu!: string;

  @ApiPropertyOptional({ example: "Жаңалықтың қысқаша сипаттамасы." })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  summaryKz?: string;

  @ApiProperty({ example: "Полный текст новости..." })
  @IsString()
  @MinLength(20)
  contentRu!: string;

  @ApiPropertyOptional({ example: "Жаңалықтың толық мәтіні..." })
  @IsOptional()
  @IsString()
  contentKz?: string;

  @ApiPropertyOptional({ enum: NewsStatus, default: NewsStatus.DRAFT })
  @IsOptional()
  @IsEnum(NewsStatus)
  status?: NewsStatus;

  @ApiPropertyOptional({ example: "news/anti-phishing-cover.jpg" })
  @IsOptional()
  @IsString()
  coverImageObjectKey?: string;

  @ApiPropertyOptional({ example: "11111111-1111-1111-1111-111111111111" })
  @IsOptional()
  @IsUUID()
  regionId?: string;
}
