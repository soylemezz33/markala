import { Module } from "@nestjs/common";
import { StorageService } from "./storage.service";
import { UploadsController } from "./uploads.controller";
import { DesignUploadsController } from "./design-uploads.controller";
import { DriveService } from "./drive.service";
import { OrderDriveService } from "./order-drive.service";

@Module({
  controllers: [UploadsController, DesignUploadsController],
  // DriveService (2026-09-03): tasarımcı çalışma/baskı dosyalarını Drive'a taşır; env yoksa kapalı.
  // OrderDriveService (2026-09-03): ödeme kesinleşince sipariş klasörünü önceden açar.
  providers: [StorageService, DriveService, OrderDriveService],
  exports: [StorageService, DriveService, OrderDriveService],
})
export class StorageModule {}
