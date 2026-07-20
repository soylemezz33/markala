import { Module } from "@nestjs/common";
import { PrismaModule } from "../prisma/prisma.module";
import { MailModule } from "../mail/mail.module";
import { LifecycleService } from "./lifecycle.service";

/**
 * Müşteri yaşam döngüsü (retention) zamanlanmış işleri — bekleyen-ödeme kurtarma maili vb.
 * Controller yok; yalnız cron tetikler. ScheduleModule.forRoot() AppModule'de kayıtlıdır.
 */
@Module({
  imports: [PrismaModule, MailModule],
  providers: [LifecycleService],
})
export class LifecycleModule {}
