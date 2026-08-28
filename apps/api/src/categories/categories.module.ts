import { Module } from "@nestjs/common";
import { CategoriesController } from "./categories.controller";
import { CategoriesService } from "./categories.service";
import { SettingsModule } from "../settings/settings.module";

@Module({
  // SettingsModule: kategori başlangıç fiyatı m² ürünlerini de kapsıyor ve onlar
  // kur/marj/KDV ayarlarıyla hesaplanıyor (bkz. hesaplananBaslangicFiyatlari).
  imports: [SettingsModule],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
