import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString, IsUUID, MaxLength } from "class-validator";

export class SummarizeComplaintDto {
  @ApiProperty({
    example: "11111111-1111-1111-1111-111111111111"
  })
  @IsUUID()
  complaintId!: string;

  @ApiPropertyOptional({
    example: "Сфокусируйся на подозрительных контактах и сумме ущерба."
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  operatorInstruction?: string;
}
