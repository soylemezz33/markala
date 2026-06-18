import { Module } from "@nestjs/common";
import { StorageService } from "./storage.service";
import { UploadsController } from "./uploads.controller";
import { DesignUploadsController } from "./design-uploads.controller";

@Module({
  controllers: [UploadsController, DesignUploadsController],
  providers: [StorageService],
  exports: [StorageService],
})
export class StorageModule {}
