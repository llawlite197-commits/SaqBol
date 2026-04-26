import { Controller, Get, Param, Patch, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { ListMyNotificationsDto } from "./dto/list-my-notifications.dto";
import { NotificationsService } from "./notifications.service";

@ApiTags("Notifications")
@ApiBearerAuth()
@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get("my")
  @ApiOkResponse({ description: "Current user's notifications." })
  listMyNotifications(
    @CurrentUser() user: AuthenticatedUser,
    @Query() query: ListMyNotificationsDto
  ): Promise<unknown> {
    return this.notificationsService.listMyNotifications(user, query);
  }

  @Patch(":id/read")
  @ApiOkResponse({ description: "Notification marked as read." })
  markAsRead(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<unknown> {
    return this.notificationsService.markAsRead(user, id);
  }

  @Patch("read-all")
  @ApiOkResponse({ description: "All user notifications marked as read." })
  markAllAsRead(@CurrentUser() user: AuthenticatedUser): Promise<unknown> {
    return this.notificationsService.markAllAsRead(user);
  }
}
