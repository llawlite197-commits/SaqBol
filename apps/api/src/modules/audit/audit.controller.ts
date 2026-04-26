import { Controller, Get, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { UserRoleCode } from "@saqbol/db";
import { Roles } from "../../common/decorators/roles.decorator";
import { AuditService } from "./audit.service";
import { ListAuditLogsDto } from "./dto/list-audit-logs.dto";

@ApiTags("Admin Audit")
@ApiBearerAuth("access-token")
@Roles(UserRoleCode.SUPERVISOR, UserRoleCode.ADMIN)
@Controller("admin/audit-logs")
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  list(@Query() query: ListAuditLogsDto) {
    return this.auditService.list(query);
  }
}
