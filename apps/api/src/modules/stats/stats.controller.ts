import { Controller, Get } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { UserRoleCode } from "@saqbol/db";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import { StatsService } from "./stats.service";

@ApiTags("Stats")
@Controller()
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Public()
  @Get("stats/public")
  @ApiOkResponse({ description: "Public portal statistics." })
  getPublicStats() {
    return this.statsService.getPublicStats();
  }

  @Public()
  @Get("stats/map")
  @ApiOkResponse({ description: "Public Kazakhstan map statistics with masked scammer contacts." })
  getMapStats() {
    return this.statsService.getMapStats();
  }

  @ApiBearerAuth()
  @Roles(UserRoleCode.OPERATOR, UserRoleCode.SUPERVISOR, UserRoleCode.ADMIN)
  @Get("admin/stats/dashboard")
  @ApiOkResponse({ description: "Workspace dashboard statistics." })
  getAdminDashboardStats() {
    return this.statsService.getAdminDashboardStats();
  }
}
