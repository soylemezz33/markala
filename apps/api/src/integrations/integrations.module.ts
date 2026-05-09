import { Global, Module } from "@nestjs/common";
import { IyzicoService } from "./iyzico/iyzico.service";
import { ParasutService } from "./parasut/parasut.service";
import { DhlService } from "./dhl/dhl.service";
import { SendgridService } from "./sendgrid/sendgrid.service";
import { NetgsmService } from "./netgsm/netgsm.service";
import { R2Service } from "./r2/r2.service";

@Global()
@Module({
  providers: [IyzicoService, ParasutService, DhlService, SendgridService, NetgsmService, R2Service],
  exports: [IyzicoService, ParasutService, DhlService, SendgridService, NetgsmService, R2Service],
})
export class IntegrationsModule {}
