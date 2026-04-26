import {
  IsDateString,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  Length,
  Matches,
  MinLength
} from "class-validator";

export class CreatePublicComplaintDto {
  @IsString()
  @IsNotEmpty()
  fullName!: string;

  @IsString()
  @Length(12, 12)
  @Matches(/^\d{12}$/)
  iin!: string;

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
  @MinLength(300)
  description!: string;

  @IsOptional()
  @IsString()
  scammerData?: string;
}
