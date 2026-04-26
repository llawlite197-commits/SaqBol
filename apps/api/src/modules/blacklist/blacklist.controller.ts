import { Controller, Get, Post, Body, Query, Req } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import type { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { BlacklistService } from "./blacklist.service";
import { CheckBlacklistDto } from "./dto/check-blacklist.dto";
import { ListMyCheckHistoryDto } from "./dto/list-my-check-history.dto";

@ApiTags("Blacklist Check")
@Controller()
export class BlacklistController {
  constructor(private readonly blacklistService: BlacklistService) {}

  @Public()
  @Post("check")
  check(
    @Body() dto: CheckBlacklistDto,
    @Req() request: Request & { user?: AuthenticatedUser | null }
  ): Promise<unknown> {
    return this.blacklistService.checkValue({
      dto,
      user: request.user ?? null,
      ip: request.ip ?? null,
      userAgent: request.headers["user-agent"] ?? null
    });
  }

  @ApiBearerAuth("access-token")
  @Get("check/history/my")
  getMyHistory(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListMyCheckHistoryDto
  ): Promise<unknown> {
    return this.blacklistService.getMyCheckHistory(user, query);
  }
}
