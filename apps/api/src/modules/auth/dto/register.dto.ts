import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsEmail, IsOptional, IsString, Matches, MinLength } from "class-validator";

export class RegisterDto {
  @ApiProperty({
    example: "citizen@saqbol.local"
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    example: "+77010000011"
  })
  @IsString()
  @Matches(/^\+?[0-9]{10,20}$/)
  phone!: string;

  @ApiProperty({
    example: "Citizen123!Secure"
  })
  @IsString()
  @MinLength(8)
  password!: string;

  @ApiProperty({
    example: "Тест"
  })
  @IsString()
  firstName!: string;

  @ApiProperty({
    example: "Пользователь"
  })
  @IsString()
  lastName!: string;

  @ApiPropertyOptional({
    example: "Демоұлы"
  })
  @IsOptional()
  @IsString()
  patronymic?: string;

  @ApiPropertyOptional({
    example: "900101300001"
  })
  @IsOptional()
  @IsString()
  @Matches(/^[0-9]{12}$/)
  iin?: string;

  @ApiPropertyOptional({
    example: "22222222-2222-2222-2222-222222222201"
  })
  @IsOptional()
  @IsString()
  regionId?: string;

  @ApiPropertyOptional({
    example: "ru"
  })
  @IsOptional()
  @IsString()
  preferredLanguage?: string;

  @ApiPropertyOptional({
    example: "г. Астана"
  })
  @IsOptional()
  @IsString()
  address?: string;
}
