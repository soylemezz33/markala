import { Module } from "@nestjs/common";
import { AuthModule } from "../auth/auth.module";
import { AnalyticsController } from "./analytics.controller";
import { AnalyticsService } from "./analytics.service";

@Module({
  // AuthModule → JwtModule (soft-decode için JwtService) + JwtAuthGuard/RolesGuard'ın
  // bağımlılıklarını (PassportModule/Reflector) sağlar.
  imports: [AuthModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService],
})
export class AnalyticsModule {}
