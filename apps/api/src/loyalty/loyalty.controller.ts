import { Controller, Get, UseGuards, Req } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import type { Request } from "express";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { LoyaltyService } from "./loyalty.service";

/**
 * Sadakat programı — müşteri hesap uçları (JWT gerekli).
 * GET /loyalty/me → { enabled, balance, redeemPerTl, history }.
 * Program kapalıysa enabled=false, balance=0, history=[] döner (storefront göstermez).
 */
@ApiTags("loyalty")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("loyalty")
export class LoyaltyController {
  constructor(private service: LoyaltyService) {}

  @Get("me")
  async me(@Req() req: Request & { user: { sub: string } }) {
    const userId = req.user.sub;
    const [balance, history] = await Promise.all([
      this.service.getBalance(userId),
      this.service.getHistory(userId),
    ]);
    return {
      enabled: this.service.isEnabled(),
      balance,
      earnPerTl: LoyaltyService.EARN_POINTS_PER_TL,
      redeemPerTl: LoyaltyService.REDEEM_POINTS_PER_TL,
      history,
    };
  }
}
