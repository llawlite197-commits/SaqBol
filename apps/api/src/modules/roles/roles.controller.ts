import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserRoleCode } from "@saqbol/db";
import { Roles } from "../../common/decorators/roles.decorator";
import { ListRolesDto } from "./dto/list-roles.dto";
import { RolesService } from "./roles.service";

@ApiTags("Admin Roles")
@ApiBearerAuth("access-token")
@Roles(UserRoleCode.ADMIN)
@Controller("admin/roles")
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  list(@Query() query: ListRolesDto) {
    return this.rolesService.list(query);
  }
}
