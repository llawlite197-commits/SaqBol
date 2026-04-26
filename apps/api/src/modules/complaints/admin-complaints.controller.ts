import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserRoleCode } from "@saqbol/db";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { ComplaintsService } from "./complaints.service";
import { AddComplaintCommentDto } from "./dto/add-complaint-comment.dto";
import { AssignComplaintDto } from "./dto/assign-complaint.dto";
import { ListAdminComplaintsDto } from "./dto/list-admin-complaints.dto";
import { UpdateComplaintStatusDto } from "./dto/update-complaint-status.dto";

@ApiTags("Admin Complaints")
@ApiBearerAuth("access-token")
@Roles(UserRoleCode.OPERATOR, UserRoleCode.SUPERVISOR, UserRoleCode.ADMIN)
@Controller("admin/complaints")
export class AdminComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Get()
  listComplaints(@Query() query: ListAdminComplaintsDto): Promise<unknown> {
    return this.complaintsService.listAdminComplaints(query);
  }

  @Get(":id")
  getComplaint(@Param("id", new ParseUUIDPipe()) complaintId: string): Promise<unknown> {
    return this.complaintsService.getAdminComplaintById(complaintId);
  }

  @Patch(":id/status")
  updateStatus(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) complaintId: string,
    @Body() dto: UpdateComplaintStatusDto
  ): Promise<unknown> {
    return this.complaintsService.updateComplaintStatus(user, complaintId, dto);
  }

  @Patch(":id/assign")
  assignComplaint(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) complaintId: string,
    @Body() dto: AssignComplaintDto
  ): Promise<unknown> {
    return this.complaintsService.assignComplaint(user, complaintId, dto);
  }

  @Post(":id/comments")
  addComment(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) complaintId: string,
    @Body() dto: AddComplaintCommentDto
  ): Promise<unknown> {
    return this.complaintsService.addAdminComment(user, complaintId, dto);
  }

  @Get(":id/history")
  getHistory(@Param("id", new ParseUUIDPipe()) complaintId: string): Promise<unknown> {
    return this.complaintsService.getComplaintHistory(complaintId);
  }
}
