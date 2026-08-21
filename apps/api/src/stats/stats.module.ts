import { Module } from "@nestjs/common";
import { SettingsModule } from "../settings/settings.module";
import { StatsController } from "./stats.controller";
import { StatsService } from "./stats.service";
import { ProfitService } from "./profit.service";

@Module({
  // ProfitService, fiyat ayarlarini (marj) okur; SettingsModule global DEGIL -> ice aktarilmali.
  imports: [SettingsModule],
  controllers: [StatsController],
  providers: [StatsService, ProfitService],
})
export class StatsModule {}
