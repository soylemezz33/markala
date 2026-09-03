import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { HealthController } from "./health.controller";
import { MailModule } from "../mail/mail.module";

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [HealthController],
})
export class HealthModule {}
