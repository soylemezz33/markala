import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { SettingsModule } from "../settings/settings.module";
import { MailModule } from "../mail/mail.module";
import { LoyaltyModule } from "../loyalty/loyalty.module";
import { StorageModule } from "../storage/storage.module";
import { OrderDesignService } from "./order-design.service";
import { OrderNoteService } from "./order-note.service";
import { KargoTakipService } from "./kargo-takip.service";

@Module({
  // StorageModule (2026-09-02): satıra tasarım dosyası yükleme/silme StorageService'i kullanır.
  imports: [SettingsModule, MailModule, LoyaltyModule, StorageModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderDesignService, OrderNoteService, KargoTakipService],
  exports: [OrdersService],
})
export class OrdersModule {}
