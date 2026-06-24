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

/** Admin: kurumsal müşterinin cari hesabını görüntüle + tahsilat gir. */
@ApiTags("corporate-ledger")
@Controller("admin/corporate-ledger")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "super_admin")
@ApiBearerAuth()
export class CorporateLedgerAdminController {
  constructor(private service: CorporateLedgerService) {}

  @Get(":userId")
  statement(@Param("userId") userId: string) {
    return this.service.getStatement(userId);
  }

  @Post(":userId/payment")
  recordPayment(@Param("userId") userId: string, @Body() dto: RecordPaymentDto) {
    return this.service.recordPayment(userId, dto.amount, dto.description);
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
