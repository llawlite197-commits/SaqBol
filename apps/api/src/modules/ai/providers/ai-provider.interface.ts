import type { AiResponseDto } from "../dto/ai-response.dto";

export type AiProviderRequest = {
  scenario: string;
  prompt: string;
  riskHint: "LOW" | "MEDIUM" | "HIGH";
};

export interface AiProvider {
  readonly isMock: boolean;
  readonly name: string;
  generate(
    request: AiProviderRequest
  ): Promise<Omit<AiResponseDto, "isMock" | "confidence" | "source" | "cannotAnswer">>;
}
