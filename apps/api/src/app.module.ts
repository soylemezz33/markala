import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ScheduleModule } from "@nestjs/schedule";
import { EncryptionModule } from "./encryption/encryption.module";
import { PrismaModule } from "./prisma/prisma.module";
import { IntegrationsModule } from "./integrations/integrations.module";
import { CategoriesModule } from "./categories/categories.module";
import { ProductsModule } from "./products/products.module";
import { ProductImagesModule } from "./products/images/product-images.module";
import { PricesModule } from "./prices/prices.module";
import { OrdersModule } from "./orders/orders.module";
import { HeroSlidesModule } from "./hero-slides/hero-slides.module";
import { SettingsModule } from "./settings/settings.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { CorporateApplicationsModule } from "./corporate-applications/corporate-applications.module";
import { CorporateLedgerModule } from "./corporate-ledger/corporate-ledger.module";
import { CorporateInvoicingModule } from "./corporate-invoicing/corporate-invoicing.module";
import { StatsModule } from "./stats/stats.module";
import { AdminUsersModule } from "./admin-users/admin-users.module";
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
import { CspModule } from "./csp/csp.module";
import { BrandsModule } from "./brands/brands.module";
import { PortfolioModule } from "./portfolio/portfolio.module";
import { LoyaltyModule } from "./loyalty/loyalty.module";
import { ContactModule } from "./contact/contact.module";
import { QuoteRequestsModule } from "./quote-requests/quote-requests.module";
import { CartLeadsModule } from "./cart-leads/cart-leads.module";
import { InternalNotifyModule } from "./internal-notify/internal-notify.module";
import { NewsletterModule } from "./newsletter/newsletter.module";
import { LifecycleModule } from "./lifecycle/lifecycle.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Zamanlanmış işler (cron) altyapısı — LifecycleService kurtarma maili bunu kullanır.
    ScheduleModule.forRoot(),
    EncryptionModule,
    PrismaModule,
    IntegrationsModule,
    AuthModule,
    UsersModule,
    CategoriesModule,
    ProductsModule,
    ProductImagesModule,
    PricesModule,
    OrdersModule,
    CorporateApplicationsModule,
    CorporateLedgerModule,
    CorporateInvoicingModule,
    HeroSlidesModule,
    SettingsModule,
    StatsModule,
    AdminUsersModule,
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
    CspModule,
    BrandsModule,
    PortfolioModule,
    LoyaltyModule,
    ContactModule,
    QuoteRequestsModule,
    CartLeadsModule,
    InternalNotifyModule,
    NewsletterModule,
    LifecycleModule,
  ],
})
export class AppModule {}
