import { Module } from "@nestjs/common";
import { CartLeadsController } from "./cart-leads.controller";
import { CartLeadsService } from "./cart-leads.service";

@Module({
  controllers: [CartLeadsController],
  providers: [CartLeadsService],
})
export class CartLeadsModule {}
