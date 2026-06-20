import { Body, Controller, Param, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { IsOptional, IsString, Matches } from "class-validator";
import { CorporateInvoicingService } from "./corporate-invoicing.service";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";

export class RunMonthDto {
  /** Faturalanacak dönem "YYYY-MM" (örn. "2026-05"). Yoksa controller reddeder. */
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: "period 'YYYY-MM' biçiminde olmalı." })
  period!: string;
}

export class InvoiceCustomerDto {
  @IsString()
  @Matches(/^\d{4}-\d{2}$/, { message: "period 'YYYY-MM' biçiminde olmalı." })
  period!: string;

  @IsOptional()
  @IsString()
  userId?: string;
}

/** Admin: kurumsal aylık (cari) faturalamayı elle tetikle. Otomatik de ay sonunda çalışır. */
@ApiTags("corporate-invoicing")
@Controller("admin/corporate-invoicing")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles("admin", "super_admin")
@ApiBearerAuth()
export class CorporateInvoicingController {
  constructor(private service: CorporateInvoicingService) {}

  /** Belirli müşteri + ay için faturalama (elle). */
  @Post(":userId")
  invoiceCustomer(@Param("userId") userId: string, @Body() dto: RunMonthDto) {
    return this.service.invoiceCustomerForMonth(userId, dto.period);
  }

  /** Bir ayın TÜM açık-hesap müşterilerini faturala (elle toplu tetik). */
  @Post()
  runMonth(@Body() dto: RunMonthDto) {
    return this.service.runForMonth(dto.period);
  }
}
