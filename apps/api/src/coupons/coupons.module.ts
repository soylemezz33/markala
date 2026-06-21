import { Module } from "@nestjs/common";
import { CouponsController } from "./coupons.controller";
import { CouponsPublicController } from "./coupons-public.controller";
import { CouponsService } from "./coupons.service";

@Module({
  controllers: [CouponsController, CouponsPublicController],
  providers: [CouponsService],
})
export class CouponsModule {}
