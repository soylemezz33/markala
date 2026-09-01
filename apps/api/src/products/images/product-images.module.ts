import { Module } from "@nestjs/common";
import { ProductImageStorageService } from "../../storage/product-image-storage.service";
import { ImageProcessorService } from "./image-processor.service";
import { ImageQueueService } from "./image-queue.service";
import { ProductImagesService } from "./product-images.service";
import { ProductImagesController } from "./product-images.controller";

/**
 * Ürün görsel altyapısı (AJA-385): R2/CDN + sharp pipeline + BullMQ kuyruğu + admin API.
 * PrismaModule global (app.module) olduğundan ayrıca import gerekmez.
 */
@Module({
  controllers: [ProductImagesController],
  providers: [
    ProductImageStorageService,
    ImageProcessorService,
    ImageQueueService,
    ProductImagesService,
  ],
  exports: [ProductImageStorageService, ImageProcessorService, ImageQueueService],
})
export class ProductImagesModule {}
