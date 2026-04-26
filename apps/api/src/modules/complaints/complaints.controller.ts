import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UploadedFiles,
  UseInterceptors
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserRoleCode } from "@saqbol/db";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Public } from "../../common/decorators/public.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { ComplaintsService } from "./complaints.service";
import { AdditionalInfoDto } from "./dto/additional-info.dto";
import { CreateComplaintDto } from "./dto/create-complaint.dto";
import { CreatePublicComplaintDto } from "./dto/create-public-complaint.dto";
import { ListMyComplaintsDto } from "./dto/list-my-complaints.dto";

@ApiTags("Complaints")
@Controller("complaints")
export class ComplaintsController {
  constructor(private readonly complaintsService: ComplaintsService) {}

  @Public()
  @Post("public")
  @UseInterceptors(FilesInterceptor("files", 10))
  createPublicComplaint(
    @Body() dto: CreatePublicComplaintDto,
    @UploadedFiles() files: Express.Multer.File[]
  ): Promise<unknown> {
    return this.complaintsService.createPublicComplaint(dto, files);
  }

  @ApiBearerAuth("access-token")
  @Roles(UserRoleCode.CITIZEN)
  @Post()
  createComplaint(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateComplaintDto
  ): Promise<unknown> {
    return this.complaintsService.createComplaint(user, dto);
  }

  @ApiBearerAuth("access-token")
  @Roles(UserRoleCode.CITIZEN)
  @Get("my")
  listMyComplaints(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListMyComplaintsDto
  ): Promise<unknown> {
    return this.complaintsService.listMyComplaints(user, query);
  }

  @ApiBearerAuth("access-token")
  @Roles(UserRoleCode.CITIZEN)
  @Get("my/:id")
  getMyComplaint(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) complaintId: string
  ): Promise<unknown> {
    return this.complaintsService.getCitizenComplaintById(user, complaintId);
  }

  @ApiBearerAuth("access-token")
  @Roles(UserRoleCode.CITIZEN)
  @Post(":id/additional-info")
  addAdditionalInfo(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) complaintId: string,
    @Body() dto: AdditionalInfoDto
  ): Promise<unknown> {
    return this.complaintsService.addCitizenAdditionalInfo(
      user,
      complaintId,
      dto
    );
  }
}