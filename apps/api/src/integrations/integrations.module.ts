import { Global, Module } from "@nestjs/common";
import { IyzicoService } from "./iyzico/iyzico.service";
import { ParasutService } from "./parasut/parasut.service";
import { DhlService } from "./dhl/dhl.service";
import { SendgridService } from "./sendgrid/sendgrid.service";
import { NetgsmService } from "./netgsm/netgsm.service";
import { MetaCapiService } from "./meta/meta-capi.service";

// NOT: R2 yükleme StorageService.putR2() üzerinden gerçek @aws-sdk/client-s3 ile yapılır
// (R2_* env'leri girilince aktif). Eski R2Service presigned-URL stub'ı kullanılmadığı için kaldırıldı.
@Global()
@Module({
  providers: [IyzicoService, ParasutService, DhlService, SendgridService, NetgsmService, MetaCapiService],
  exports: [IyzicoService, ParasutService, DhlService, SendgridService, NetgsmService, MetaCapiService],
})
export class IntegrationsModule {}
