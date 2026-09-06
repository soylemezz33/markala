import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { MailModule } from "../mail/mail.module";
import { LifecycleService } from "./lifecycle.service";
import { RetentionService } from "./retention.service";
import { LifecycleController } from "./lifecycle.controller";
import { LoyaltyModule } from "../loyalty/loyalty.module";

/**
 * Müşteri yaşam döngüsü (retention) zamanlanmış işleri — bekleyen-ödeme kurtarma maili vb.
 * RetentionService (2026-09-06): ikinci sipariş kuponu, tekrar sipariş hatırlatması, puan süresi.
 * Controller yok; yalnız cron tetikler. ScheduleModule.forRoot() AppModule'de kayıtlıdır.
 */
@Module({
  imports: [PrismaModule, MailModule, LoyaltyModule],
  controllers: [LifecycleController],
  providers: [LifecycleService, RetentionService],
})
export class LifecycleModule {}
