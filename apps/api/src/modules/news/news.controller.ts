import { Controller, Get, Param, Query } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { ListNewsDto } from "./dto/list-news.dto";
import { NewsService } from "./news.service";

@ApiTags("Public News")
@Public()
@Controller("news")
export class NewsController {
  constructor(private readonly newsService: NewsService) {}

  @Get()
  @ApiOkResponse({ description: "Published news list." })
  listPublishedNews(@Query() query: ListNewsDto) {
    return this.newsService.listPublishedNews(query);
  }

  @Get(":slug")
  @ApiOkResponse({ description: "Published news detail." })
  getPublishedNewsBySlug(@Param("slug") slug: string) {
    return this.newsService.getPublishedNewsBySlug(slug);
  }
}
