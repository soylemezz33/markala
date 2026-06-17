import { Body, Controller, Post, Req, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";
import type { Request, Response } from "express";
import { PaymentsService } from "./payments.service";

class InitPaymentDto {
  @IsString()
  orderId!: string;

  /** Gerçek müşteri IP'si — storefront sunucu-içinden çağırdığında iletilir (fraud skoru için). */
  @IsOptional()
  @IsString()
  clientIp?: string;
}

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /** Storefront (misafir dahil) ödeme başlatır → iyzico hosted ödeme sayfası URL'i döner. */
  @Post("iyzico/init")
  async init(@Body() dto: InitPaymentDto, @Req() req: Request) {
    return this.payments.initCheckout(dto.orderId, dto.clientIp || req.ip);
  }

  /**
   * iyzico ödeme sonrası tarayıcıyı buraya POST eder (x-www-form-urlencoded, token alanı).
   * Sonucu doğrulayıp siparişi güncelleriz ve tarayıcıyı başarı/hata sayfasına 303 ile yönlendiririz.
   */
  @Post("iyzico/callback")
  async callback(@Body("token") token: string, @Res() res: Response) {
    const { redirectUrl } = await this.payments.handleCallback(token);
    res.redirect(303, redirectUrl);
  }
}
