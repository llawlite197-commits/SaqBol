import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserRoleCode } from "@saqbol/db";
import { Roles } from "../../common/decorators/roles.decorator";
import { ListUsersDto } from "./dto/list-users.dto";
import { UsersService } from "./users.service";

@ApiTags("Admin Users")
@ApiBearerAuth("access-token")
@Roles(UserRoleCode.ADMIN)
@Controller("admin/users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  list(@Query() query: ListUsersDto) {
    return this.usersService.list(query);
  }
}
