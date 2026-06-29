import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { SettingsModule } from "../settings/settings.module";
import { MailModule } from "../mail/mail.module";

@Module({
  imports: [SettingsModule, MailModule],
  controllers: [OrdersController],
  providers: [OrdersService],
  exports: [OrdersService],
})
export class OrdersModule {}
