import { Body, Controller, Get, Param, ParseUUIDPipe, Post, Query, Res } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { UserRoleCode } from "@saqbol/db";
import type { Response } from "express";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { ExportComplaintsDto } from "./dto/export-complaints.dto";
import { ListExportJobsDto } from "./dto/list-export-jobs.dto";
import { ExportService } from "./export.service";

@ApiTags("Admin Export")
@ApiBearerAuth("access-token")
@Roles(UserRoleCode.OPERATOR, UserRoleCode.SUPERVISOR, UserRoleCode.ADMIN)
@Controller("admin/export")
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post("complaints")
  @ApiOkResponse({ description: "Complaint export job completed." })
  exportComplaints(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: ExportComplaintsDto
  ): Promise<unknown> {
    return this.exportService.exportComplaints(user, dto);
  }

  @Get("jobs")
  @ApiOkResponse({ description: "Export jobs list." })
  listJobs(@Query() query: ListExportJobsDto): Promise<unknown> {
    return this.exportService.listJobs(query);
  }

  @Get("jobs/:id/download")
  @ApiOkResponse({ description: "Export file download." })
  downloadJob(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) jobId: string,
    @Res() response: Response
  ): Promise<void> {
    return this.exportService.downloadJob(user, jobId, response);
  }
}
