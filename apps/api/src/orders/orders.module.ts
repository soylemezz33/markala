import { Module } from "@nestjs/common";
import { OrdersController } from "./orders.controller";
import { OrdersService } from "./orders.service";
import { InvoiceService } from "./invoice.service";
import { SettingsModule } from "../settings/settings.module";
import { MailModule } from "../mail/mail.module";
import { LoyaltyModule } from "../loyalty/loyalty.module";
import { StorageModule } from "../storage/storage.module";
import { OrderDesignService } from "./order-design.service";
import { OrderNoteService } from "./order-note.service";
import { KargoTakipService } from "./kargo-takip.service";
import { OdemeSonrasiModule } from "./odeme-sonrasi.module";

@Module({
  // StorageModule (2026-09-02): satıra tasarım dosyası yükleme/silme StorageService'i kullanır.
  // OdemeSonrasiModule (2026-09-08): havale/IBAN tahsilatı onaylanınca sipariş otomatik
  // "Tasarım Bekleniyor"a alınır ve WhatsApp bildirimi gider.
  imports: [SettingsModule, MailModule, LoyaltyModule, StorageModule, OdemeSonrasiModule],
  controllers: [OrdersController],
  providers: [OrdersService, OrderDesignService, OrderNoteService, KargoTakipService, InvoiceService],
  exports: [OrdersService, InvoiceService],
})
export class OrdersModule {}
