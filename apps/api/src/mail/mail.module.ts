import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { MailService } from "./mail.service";
import { NotificationLogsController } from "./notification-logs.controller";

@Module({
  imports: [PrismaModule],
  controllers: [NotificationLogsController],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
