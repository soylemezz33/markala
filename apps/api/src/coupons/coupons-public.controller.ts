import { Controller, Post, Body } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { CouponsService } from "./coupons.service";
import { ValidateCouponDto } from "./coupons.dto";

/**
 * Kupon PUBLIC endpoint'i — checkout'ta kupon anında doğrulama (guard YOK).
 * Admin CRUD (CouponsController) class-level admin guard'lı olduğu için doğrulama
 * ayrı controller'a alındı. Sipariş OLUŞTURMAZ, sadece geçerlilik + indirim döndürür.
 */
@ApiTags("coupons")
@Controller("coupons")
export class CouponsPublicController {
  constructor(private service: CouponsService) {}

  @Post("validate")
  @ApiOperation({ summary: "Kupon doğrula (public) — geçerlilik + gerçek indirim tutarı" })
  validate(@Body() dto: ValidateCouponDto) {
    return this.service.validate(dto.code, dto.subtotal, { email: dto.email });
  }
}
