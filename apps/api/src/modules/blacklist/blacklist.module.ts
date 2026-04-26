import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { AdminBlacklistController } from "./admin-blacklist.controller";
import { BlacklistController } from "./blacklist.controller";
import { BlacklistService } from "./blacklist.service";

@Module({
  imports: [PrismaModule],
  controllers: [BlacklistController, AdminBlacklistController],
  providers: [BlacklistService],
  exports: [BlacklistService]
})
export class BlacklistModule {}
