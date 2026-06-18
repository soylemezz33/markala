import { Body, Controller, Post, Req, Res, UseGuards } from "@nestjs/common";
import { ApiTags, ApiBearerAuth } from "@nestjs/swagger";
import { IsIP, IsOptional, IsString } from "class-validator";
import type { Request, Response } from "express";
import { PaymentsService } from "./payments.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";

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

  /** Bireysel müşteri TC Kimlik No (iyzico buyer.identityNumber). Yoksa geçerli yer tutucu kullanılır. */
  @IsOptional()
  @IsString()
  identityNumber?: string;
}

class RetryPaymentDto {
  @IsString()
  orderId!: string;

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
    return this.payments.initCheckout(dto.orderId, dto.paymentNonce, dto.clientIp || req.ip, dto.identityNumber);
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

  /** Giriş yapmış müşteri "Ödeme Yap" — KENDİ beklemede siparişi için ödemeyi yeniden başlatır. */
  @Post("iyzico/retry")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  async retry(@Body() dto: RetryPaymentDto, @Req() req: Request & { user: { sub: string } }) {
    return this.payments.retryCheckoutForOwner(dto.orderId, req.user.sub, dto.clientIp || req.ip);
  }

  /** Admin: callback kaçan ödemeleri elle eşitle (güvenlik ağı). Otomatik de 10 dk'da bir çalışır. */
  @Post("reconcile")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  reconcile() {
    return this.payments.reconcilePendingPayments();
  }
}
