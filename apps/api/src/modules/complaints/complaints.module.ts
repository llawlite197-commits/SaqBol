import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { AdminComplaintsController } from "./admin-complaints.controller";
import { ComplaintsController } from "./complaints.controller";
import { ComplaintsService } from "./complaints.service";

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [ComplaintsController, AdminComplaintsController],
  providers: [ComplaintsService],
  exports: [ComplaintsService]
})
export class ComplaintsModule {}
