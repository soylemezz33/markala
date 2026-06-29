import { Module } from "@nestjs/common";
import { PaymentsController } from "./payments.controller";
import { PaymentsService } from "./payments.service";
import { MailModule } from "../mail/mail.module";

// PrismaModule ve IntegrationsModule (IyzicoService) @Global → ayrıca import gerekmez.
@Module({
  imports: [MailModule],
  controllers: [PaymentsController],
  providers: [PaymentsService],
  exports: [PaymentsService],
})
export class PaymentsModule {}
