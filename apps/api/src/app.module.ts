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
import { CorporateApplicationsModule } from "./corporate-applications/corporate-applications.module";
import { StatsModule } from "./stats/stats.module";
import { CouponsModule } from "./coupons/coupons.module";
import { ReviewsModule } from "./reviews/reviews.module";
import { BlogModule } from "./blog/blog.module";
import { BannersModule } from "./banners/banners.module";
import { FaqsModule } from "./faqs/faqs.module";
import { LegalModule } from "./legal/legal.module";
import { CampaignPackagesModule } from "./campaign-packages/campaign-packages.module";
import { StorageModule } from "./storage/storage.module";
import { HealthModule } from "./health/health.module";
import { PaymentsModule } from "./payments/payments.module";
import { AnalyticsModule } from "./analytics/analytics.module";
import { BrandsModule } from "./brands/brands.module";

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
    HealthModule,
    PaymentsModule,
    AnalyticsModule,
    BrandsModule,
  ],
})
export class AppModule {}
