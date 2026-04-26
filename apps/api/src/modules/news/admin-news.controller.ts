import { Body, Controller, Delete, Get, Param, Patch, Post, Query } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { UserRoleCode } from "@saqbol/db";
import { Roles } from "../../common/decorators/roles.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import type { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { CreateNewsDto } from "./dto/create-news.dto";
import { ListNewsDto } from "./dto/list-news.dto";
import { PublishNewsDto } from "./dto/publish-news.dto";
import { UpdateNewsDto } from "./dto/update-news.dto";
import { NewsService } from "./news.service";

@ApiTags("Admin News")
@ApiBearerAuth()
@Roles(UserRoleCode.ADMIN)
@Controller("admin/news")
export class AdminNewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiOkResponse({ description: "All news for admins." })
  listAdminNews(@Query() query: ListNewsDto) {
    return this.newsService.listAdminNews(query);
  }

  @Post()
  @ApiCreatedResponse({ description: "News draft created." })
  createNews(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateNewsDto) {
    return this.newsService.createNews(user, dto);
  }

  @Patch(":id")
  @ApiOkResponse({ description: "News updated." })
  updateNews(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateNewsDto
  ) {
    return this.newsService.updateNews(user, id, dto);
  }

  @Delete(":id")
  @ApiOkResponse({ description: "News archived." })
  deleteNews(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.newsService.archiveNews(user, id);
  }

  @Patch(":id/publish")
  @ApiOkResponse({ description: "News published." })
  publishNews(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: PublishNewsDto
  ) {
    return this.newsService.publishNews(user, id, dto);
  }
}
