import { Body, Controller, Delete, Param, Patch, Post } from "@nestjs/common";
import { ApiBearerAuth, ApiCreatedResponse, ApiOkResponse, ApiTags } from "@nestjs/swagger";
import { UserRoleCode } from "@saqbol/db";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { Roles } from "../../common/decorators/roles.decorator";
import type { AuthenticatedUser } from "../../common/interfaces/authenticated-user.interface";
import { CreateFraudTypeDto } from "./dto/create-fraud-type.dto";
import { CreateRegionDto } from "./dto/create-region.dto";
import { UpdateFraudTypeDto } from "./dto/update-fraud-type.dto";
import { UpdateRegionDto } from "./dto/update-region.dto";
import { DictionariesService } from "./dictionaries.service";

@ApiTags("Admin Dictionaries")
@ApiBearerAuth()
@Roles(UserRoleCode.ADMIN)
@Controller("admin/dictionaries")
export class AdminDictionariesController {
  constructor(private readonly dictionariesService: DictionariesService) {}

  @Post("regions")
  @ApiCreatedResponse({ description: "Region created." })
  createRegion(@CurrentUser() user: AuthenticatedUser, @Body() dto: CreateRegionDto) {
    return this.dictionariesService.createRegion(user, dto);
  }

  @Patch("regions/:id")
  @ApiOkResponse({ description: "Region updated." })
  updateRegion(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateRegionDto
  ) {
    return this.dictionariesService.updateRegion(user, id, dto);
  }

  @Delete("regions/:id")
  @ApiOkResponse({ description: "Region deactivated." })
  deleteRegion(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.dictionariesService.deactivateRegion(user, id);
  }

  @Post("fraud-types")
  @ApiCreatedResponse({ description: "Fraud type created." })
  createFraudType(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: CreateFraudTypeDto
  ) {
    return this.dictionariesService.createFraudType(user, dto);
  }

  @Patch("fraud-types/:id")
  @ApiOkResponse({ description: "Fraud type updated." })
  updateFraudType(
    @CurrentUser() user: AuthenticatedUser,
    @Param("id") id: string,
    @Body() dto: UpdateFraudTypeDto
  ) {
    return this.dictionariesService.updateFraudType(user, id, dto);
  }

  @Delete("fraud-types/:id")
  @ApiOkResponse({ description: "Fraud type archived." })
  deleteFraudType(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string) {
    return this.dictionariesService.archiveFraudType(user, id);
  }
}
