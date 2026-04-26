import { Body, Controller, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { UserRoleCode } from "@saqbol/db";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { AiService } from "./ai.service";
import { AiChatDto } from "./dto/ai-chat.dto";
import { AiResponseDto } from "./dto/ai-response.dto";
import { AnalyzeSmsDto } from "./dto/analyze-sms.dto";
import { AnalyzeUrlDto } from "./dto/analyze-url.dto";
import { SummarizeComplaintDto } from "./dto/summarize-complaint.dto";

@ApiTags("AI Assistant")
@Controller()
export class AiController {
  constructor(private readonly aiService: AiService) {}

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 20 } })
  @Post("ai/chat")
  @ApiOkResponse({ type: AiResponseDto })
  chat(@Body() dto: AiChatDto) {
    return this.aiService.chat(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 15 } })
  @Post("ai/analyze-sms")
  @ApiOkResponse({ type: AiResponseDto })
  analyzeSms(@Body() dto: AnalyzeSmsDto) {
    return this.aiService.analyzeSms(dto);
  }

  @Public()
  @Throttle({ default: { ttl: 60_000, limit: 15 } })
  @Post("ai/analyze-url")
  @ApiOkResponse({ type: AiResponseDto })
  analyzeUrl(@Body() dto: AnalyzeUrlDto) {
    return this.aiService.analyzeUrl(dto);
  }

  @ApiBearerAuth("access-token")
  @Roles(UserRoleCode.OPERATOR, UserRoleCode.SUPERVISOR, UserRoleCode.ADMIN)
  @Throttle({ default: { ttl: 60_000, limit: 30 } })
  @Post("admin/ai/summarize-complaint")
  @ApiOkResponse({ type: AiResponseDto })
  summarizeComplaint(@CurrentUser() user: AuthenticatedUser, @Body() dto: SummarizeComplaintDto) {
    return this.aiService.summarizeComplaint(dto, user);
  }
}
