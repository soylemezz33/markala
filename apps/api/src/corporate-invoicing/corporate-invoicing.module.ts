import { Module } from "@nestjs/common";
import { MailModule } from "../mail/mail.module";
import { CorporateInvoicingService } from "./corporate-invoicing.service";
import { CorporateInvoicingController } from "./corporate-invoicing.controller";

@Module({
  imports: [MailModule],
  controllers: [CorporateInvoicingController],
  providers: [CorporateInvoicingService],
  exports: [CorporateInvoicingService],
})
export class CorporateInvoicingModule {}
