import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength
} from "class-validator";

export class CreatePublicComplaintDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsEmail()
  email!: string;

  @IsDateString()
  incidentDate!: string;

  @IsOptional()
  @IsString()
  damageAmount?: string;

  @IsString()
  @IsNotEmpty()
  regionId!: string;

  @IsString()
  @IsNotEmpty()
  fraudTypeId!: string;

  @IsString()
  @MinLength(30)
  description!: string;

  @IsOptional()
  @IsString()
  scammerData?: string;
}