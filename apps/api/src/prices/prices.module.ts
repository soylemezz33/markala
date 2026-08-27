import { Module } from "@nestjs/common";
import { PricesController } from "./prices.controller";
import { PricesService } from "./prices.service";
import { SettingsModule } from "../settings/settings.module";

@Module({ imports: [SettingsModule], controllers: [PricesController], providers: [PricesService], exports: [PricesService] })
export class PricesModule {}
