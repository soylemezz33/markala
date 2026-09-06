import { Module } from "@nestjs/common";
import { LoyaltyController, LoyaltyPublicController } from "./loyalty.controller";
import { LoyaltyService } from "./loyalty.service";

@Module({
  controllers: [LoyaltyPublicController, LoyaltyController],
  providers: [LoyaltyService],
  // OrdersModule (harcama) ve PaymentsModule (kazanım) LoyaltyService'i enjekte eder.
  exports: [LoyaltyService],
})
export class LoyaltyModule {}
