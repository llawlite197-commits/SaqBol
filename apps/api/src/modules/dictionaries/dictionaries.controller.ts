import { Controller, Get } from "@nestjs/common";
import { ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { Public } from "../../common/decorators/public.decorator";
import { DictionariesService } from "./dictionaries.service";

@ApiTags("Public Dictionaries")
@Public()
@Controller("dictionaries")
export class DictionariesController {
  constructor(private readonly dictionariesService: DictionariesService) {}

  @Get("regions")
  @ApiOkResponse({ description: "Active Kazakhstan regions." })
  getRegions() {
    return this.dictionariesService.getPublicRegions();
  }

  @Get("fraud-types")
  @ApiOkResponse({ description: "Active fraud types." })
  getFraudTypes() {
    return this.dictionariesService.getPublicFraudTypes();
  }
}
