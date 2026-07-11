import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { SettingsModule } from "../settings/settings.module";
import { MailModule } from "../mail/mail.module";
import { LoyaltyModule } from "../loyalty/loyalty.module";

@Module({
  imports: [SettingsModule, MailModule, LoyaltyModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
