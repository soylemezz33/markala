import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { MailModule } from "../mail/mail.module";
import { LoyaltyModule } from "../loyalty/loyalty.module";
import { StorageModule } from "../storage/storage.module";

// PrismaModule ve IntegrationsModule (IyzicoService) @Global → ayrıca import gerekmez.
@Module({
  // StorageModule (2026-09-03): ödeme başarıyla işaretlenince Drive sipariş klasörü açılır (OrderDriveService).
  imports: [MailModule, LoyaltyModule, StorageModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
