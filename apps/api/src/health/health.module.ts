import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { HealthController } from "./health.controller";
import { MailModule } from "../mail/mail.module";
import { SistemSagligiService } from "./sistem-sagligi.service";

@Module({
  imports: [PrismaModule, MailModule],
  controllers: [HealthController],
  providers: [SistemSagligiService],
})
export class HealthModule {}
