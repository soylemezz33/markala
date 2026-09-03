import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { MailService } from "./mail.service";
import { NotificationLogsController } from "./notification-logs.controller";
import { MailHealthService } from "./mail-health.service";

@Module({
  imports: [PrismaModule],
  controllers: [NotificationLogsController],
  // MailHealthService (2026-09-03): gönderim arızasında uyarı + GET /health/mail durumu.
  providers: [MailHealthService, MailService],
  exports: [MailService, MailHealthService],
})
export class MailModule {}
