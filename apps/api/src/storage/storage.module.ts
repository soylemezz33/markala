import { Module } from "@nestjs/common";
import { StorageService } from "./storage.service";
import { UploadsController } from "./uploads.controller";
import { DesignUploadsController } from "./design-uploads.controller";
import { DriveService } from "./drive.service";

@Module({
  controllers: [UploadsController, DesignUploadsController],
  // DriveService (2026-09-03): tasarımcı çalışma/baskı dosyalarını Drive'a taşır; env yoksa kapalı.
  providers: [StorageService, DriveService],
  exports: [StorageService, DriveService],
})
export class StorageModule {}
