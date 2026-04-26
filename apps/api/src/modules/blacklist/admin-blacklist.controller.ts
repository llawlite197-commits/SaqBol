import {
  Body,
  Controller,
  Delete,
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
import { BlacklistService } from "./blacklist.service";
import { CreateBlacklistEntryDto } from "./dto/create-blacklist-entry.dto";
import { ListAdminBlacklistDto } from "./dto/list-admin-blacklist.dto";
import { UpdateBlacklistEntryDto } from "./dto/update-blacklist-entry.dto";

@ApiTags("Admin Blacklist")
@ApiBearerAuth("access-token")
@Roles(UserRoleCode.OPERATOR, UserRoleCode.SUPERVISOR, UserRoleCode.ADMIN)
@Controller("admin/blacklist")
export class AdminBlacklistController {
  constructor(private readonly blacklistService: BlacklistService) {}

  @Get()
  list(@Query() query: ListAdminBlacklistDto) {
    return this.blacklistService.listAdminBlacklist(query);
  }

  @Post()
  create(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateBlacklistEntryDto
  ) {
    return this.blacklistService.createBlacklistEntry(user, dto);
  }

  @Patch(":id")
  update(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) entryId: string,
    @Body() dto: UpdateBlacklistEntryDto
  ) {
    return this.blacklistService.updateBlacklistEntry(user, entryId, dto);
  }

  @Delete(":id")
  remove(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id", new ParseUUIDPipe()) entryId: string
  ) {
    return this.blacklistService.deleteBlacklistEntry(user, entryId);
  }
}
