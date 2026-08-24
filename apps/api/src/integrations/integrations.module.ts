import { Global, Module } from "@nestjs/common";
import { IyzicoService } from "./iyzico/iyzico.service";
import { ParasutService } from "./parasut/parasut.service";
import { DhlService } from "./dhl/dhl.service";
import { NetgsmService } from "./netgsm/netgsm.service";
import { MetaCapiService } from "./meta/meta-capi.service";

// NOT: R2 yükleme StorageService.putR2() üzerinden gerçek @aws-sdk/client-s3 ile yapılır
// (R2_* env'leri girilince aktif). Eski R2Service presigned-URL stub'ı kullanılmadığı için kaldırıldı.
//
// NOT (2026-08-24): SendgridService de aynı gerekçeyle kaldırıldı — saf stub'dı, hiçbir yerden
// inject edilmiyordu ve TÜM transactional mail zaten MailService (nodemailer/SMTP → MDaemon)
// üzerinden gidiyor. Admin "Entegrasyonlar" sayfası da SendGrid yerine gerçek SMTP durumunu
// gösterecek şekilde düzeltildi (stats.service.ts integrationStatus).
@Global()
@Module({
  providers: [IyzicoService, ParasutService, DhlService, NetgsmService, MetaCapiService],
  exports: [IyzicoService, ParasutService, DhlService, NetgsmService, MetaCapiService],
})
export class IntegrationsModule {}
