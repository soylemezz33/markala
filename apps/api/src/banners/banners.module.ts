import { Module } from "@nestjs/common";
import { BannersController } from "./banners.controller";
import { BannersPublicController } from "./banners-public.controller";
import { BannersService } from "./banners.service";

@Module({
  controllers: [BannersPublicController, BannersController],
  providers: [BannersService],
})
export class BannersModule {}
