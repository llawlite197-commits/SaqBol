import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { AiController } from "./ai.controller";
import { AiSafetyService } from "./ai-safety.service";
import { AiService } from "./ai.service";
import { MockAiProvider } from "./providers/mock-ai.provider";
import { OpenAiProvider } from "./providers/openai-ai.provider";

@Module({
  imports: [PrismaModule],
  controllers: [AiController],
  providers: [AiService, AiSafetyService, MockAiProvider, OpenAiProvider],
  exports: [AiService]
})
export class AiModule {}
