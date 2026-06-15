import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EncryptionModule } from "./encryption/encryption.module";
import { PrismaModule } from "./prisma/prisma.module";
import { IntegrationsModule } from "./integrations/integrations.module";
import { CategoriesModule } from "./categories/categories.module";
import { ProductsModule } from "./products/products.module";
import { OrdersModule } from "./orders/orders.module";
import { HeroSlidesModule } from "./hero-slides/hero-slides.module";
import { SettingsModule } from "./settings/settings.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { AdminModule } from "./admin/admin.module";
import { CorporateApplicationsModule } from "./corporate-applications/corporate-applications.module";
import { HealthController } from "./health/health.controller";
import { StatsModule } from "./stats/stats.module";
import { CouponsModule } from "./coupons/coupons.module";
import { ReviewsModule } from "./reviews/reviews.module";
import { BlogModule } from "./blog/blog.module";
import { BannersModule } from "./banners/banners.module";
import { FaqsModule } from "./faqs/faqs.module";
import { LegalModule } from "./legal/legal.module";
import { CampaignPackagesModule } from "./campaign-packages/campaign-packages.module";
import { StorageModule } from "./storage/storage.module";
import { AiModule } from "./ai/ai.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EncryptionModule,
    PrismaModule,
    IntegrationsModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    OrdersModule,
    AdminModule,
    CorporateApplicationsModule,
    HeroSlidesModule,
    SettingsModule,
    StatsModule,
    CouponsModule,
    ReviewsModule,
    BlogModule,
    BannersModule,
    FaqsModule,
    LegalModule,
    CampaignPackagesModule,
    StorageModule,
    AiModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
