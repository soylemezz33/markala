import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EncryptionModule } from "./encryption/encryption.module";
import { PrismaModule } from "./prisma/prisma.module";
import { IntegrationsModule } from "./integrations/integrations.module";
import { CategoriesModule } from "./categories/categories.module";
import { ProductsModule } from "./products/products.module";
import { OrdersModule } from "./orders/orders.module";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { HealthController } from "./health/health.controller";

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
  ],
  controllers: [HealthController],
})
export class AppModule {}
