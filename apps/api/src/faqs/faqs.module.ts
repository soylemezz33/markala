import { Module } from "@nestjs/common";
import { FaqsController, PublicFaqsController } from "./faqs.controller";
import { FaqsService } from "./faqs.service";

@Module({
  // Sıra önemli: "faqs/public" rotası "faqs/:id" benzeri bir rotaya yutulmasın diye
  // public controller önce kaydedilir (mevcut uçlarda :id yalnız PATCH/DELETE'te var
  // ama gelecekte GET :id eklenirse tuzak olmasın).
  controllers: [PublicFaqsController, FaqsController],
  providers: [FaqsService],
})
export class FaqsModule {}
