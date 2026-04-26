import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiBearerAuth, ApiConsumes, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { complaintUploadLimits } from "./helpers/file-validation.helper";
import { FilesService } from "./files.service";

@ApiTags("Files")
@ApiBearerAuth("access-token")
@Controller()
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post("complaints/:id/files")
  @ApiConsumes("multipart/form-data")
  @ApiOkResponse({ description: "Complaint file uploaded." })
  @UseInterceptors(FileInterceptor("file", { limits: complaintUploadLimits }))
  uploadComplaintFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) complaintId: string,
    @UploadedFile() file: Express.Multer.File
  ): Promise<unknown> {
    return this.filesService.uploadComplaintFile(user, complaintId, file);
  }

  @Get("files/:id/download")
  @ApiOkResponse({ description: "Complaint file download." })
  downloadFile(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) fileId: string,
    @Res() response: Response
  ): Promise<void> {
    return this.filesService.downloadComplaintFile(user, fileId, response);
  }
}
