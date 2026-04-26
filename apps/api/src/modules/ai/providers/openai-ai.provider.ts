import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { AiResponseDto } from "../dto/ai-response.dto";
import { SAQBOL_AI_DEVELOPER_PROMPT, SAQBOL_AI_SYSTEM_PROMPT } from "../prompts/ai-prompts";
import type { AiProvider, AiProviderRequest } from "./ai-provider.interface";

@Injectable()
export class OpenAiProvider implements AiProvider {
  readonly isMock = false;
  readonly name = "openai";
  private readonly logger = new Logger(OpenAiProvider.name);

  constructor(private readonly config: ConfigService) {}

  async generate(
    request: AiProviderRequest
  ): Promise<Omit<AiResponseDto, "isMock" | "confidence" | "source" | "cannotAnswer">> {
    const apiKey = this.config.get<string>("OPENAI_API_KEY");
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not configured.");
    }

    const baseUrl = this.config.get<string>("OPENAI_BASE_URL") ?? "https://api.openai.com/v1";
    const model = this.config.get<string>("OPENAI_MODEL") ?? "gpt-4o-mini";

    const response = await fetch(`${baseUrl.replace(/\/$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        response_format: { type: "json_object" },
        messages: [
          { role: "system", content: SAQBOL_AI_SYSTEM_PROMPT },
          { role: "developer", content: SAQBOL_AI_DEVELOPER_PROMPT },
          { role: "user", content: request.prompt }
        ]
      })
    });

    if (!response.ok) {
      const body = await response.text();
      this.logger.warn(`OpenAI request failed: ${response.status} ${body.slice(0, 300)}`);
      throw new Error("AI provider request failed.");
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const content = payload.choices?.[0]?.message?.content;
    if (!content) throw new Error("AI provider returned empty response.");

    const parsed = JSON.parse(content) as Partial<AiResponseDto>;
    return {
      riskLevel: parsed.riskLevel ?? request.riskHint,
      answer: parsed.answer ?? "Ответ AI недоступен.",
      redFlags: Array.isArray(parsed.redFlags) ? parsed.redFlags : [],
      recommendedActions: Array.isArray(parsed.recommendedActions) ? parsed.recommendedActions : [],
      suggestedFraudType: parsed.suggestedFraudType ?? null,
      safetyNotice:
        parsed.safetyNotice ??
        "AI не принимает решений вместо сотрудника и не дает юридически значимых заключений.",
      refusalReason: parsed.refusalReason ?? null
    };
  }
}
