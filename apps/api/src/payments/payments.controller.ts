import { Body, Controller, Post, Req, Res } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { IsIP, IsOptional, IsString } from "class-validator";
import type { Request, Response } from "express";
import { PaymentsService } from "./payments.service";

class InitPaymentDto {
  @IsString()
  orderId!: string;

  /** Sipariş oluşturma yanıtında verilen HMAC nonce — IDOR koruması, zorunlu. */
  @IsString()
  paymentNonce!: string;

  /** Gerçek müşteri IP'si (fraud skoru). Geçerli IP değilse reddedilir; yoksa req.ip kullanılır. */
  @IsOptional()
  @IsIP()
  clientIp?: string;
}

@ApiTags("payments")
@Controller("payments")
export class PaymentsController {
  constructor(private readonly payments: PaymentsService) {}

  /** Storefront (misafir dahil) ödeme başlatır → iyzico hosted ödeme sayfası URL'i döner. */
  @Post("iyzico/init")
  async init(@Body() dto: InitPaymentDto, @Req() req: Request) {
    return this.payments.initCheckout(dto.orderId, dto.paymentNonce, dto.clientIp || req.ip);
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
