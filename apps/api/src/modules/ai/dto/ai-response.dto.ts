import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";

export type AiRiskLevel = "LOW" | "MEDIUM" | "HIGH";
export type AiConfidence = "LOW" | "MEDIUM";
export type AiSource = "MOCK" | "RULE_BASED";

export class AiResponseDto {
  @ApiProperty({ enum: ["LOW", "MEDIUM", "HIGH"] })
  riskLevel!: AiRiskLevel;

  @ApiProperty()
  answer!: string;

  @ApiProperty({ type: [String] })
  redFlags!: string[];

  @ApiProperty({ type: [String] })
  recommendedActions!: string[];

  @ApiPropertyOptional()
  suggestedFraudType?: string | null;

  @ApiProperty()
  safetyNotice!: string;

  @ApiProperty()
  isMock!: boolean;

  @ApiPropertyOptional()
  refusalReason?: string | null;

  @ApiProperty({ enum: ["LOW", "MEDIUM"] })
  confidence!: AiConfidence;

  @ApiProperty({ enum: ["MOCK", "RULE_BASED"] })
  source!: AiSource;

  @ApiProperty()
  cannotAnswer!: boolean;
}
