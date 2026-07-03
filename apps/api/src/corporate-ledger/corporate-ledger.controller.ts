import { Body, Controller, Get, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { IsNumber, IsOptional, IsString, Max, MaxLength, Min } from "class-validator";
import { CorporateLedgerService } from "./corporate-ledger.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";

export class RecordPaymentDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  @Max(100000000)
  amount!: number;

  @IsString()
  @IsOptional()
  @MaxLength(200)
  description?: string;
}

/**
 * Admin: kurumsal müşterinin cari hesabını görüntüle + tahsilat gir.
 *
 * ERİŞİM MODELİ: Markala tek-operatörlü bir işletme — admin paneli tasarım gereği
 * TÜM müşterilere erişir (per-müşteri "atanmış temsilci" kavramı yoktur; bu klasik
 * IDOR değil, admin'in doğal kapsamıdır). Yine de least-privilege: cari (finansal)
 * uçlar yalnız `super_admin`e açıktır — ileride destek/içerik seviyesinde bir `admin`
 * rolü eklenirse finansal veriye/tahsilata dokunamaz. Çok-admin + per-müşteri atama
 * gerekirse ownership/ACL kontrolü BURAYA eklenmelidir.
 */
@ApiTags("corporate-ledger")
@Controller("admin/corporate-ledger")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("super_admin")
@ApiBearerAuth()
export class CorporateLedgerAdminController {
  constructor(private service: CorporateLedgerService) {}

  @Get(":userId")
  statement(@Param("userId") userId: string) {
    return this.service.getStatement(userId);
  }

  @Post(":userId/payment")
  recordPayment(
    @Param("userId") userId: string,
    @Body() dto: RecordPaymentDto,
    @Req() req: Request & { user?: { sub?: string } },
  ) {
    return this.service.recordPayment(userId, dto.amount, dto.description, {
      actorId: req.user?.sub ?? null,
      ipAddress: req.ip ?? null,
    });
  }
}

/** Müşteri: kendi cari hesap ekstresi. */
@ApiTags("corporate-ledger")
@Controller("users/me/ledger")
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CorporateLedgerMeController {
  constructor(private service: CorporateLedgerService) {}

  @Get()
  myStatement(@Req() req: Request & { user: { sub: string } }) {
    return this.service.getStatement(req.user.sub);
  }
}
