import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { QuoteRequestsService } from "./quote-requests.service";
import { CreateQuoteRequestDto } from "./quote-requests.dto";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";

@ApiTags("quote-requests")
@Controller("quote-requests")
export class QuoteRequestsController {
  constructor(private service: QuoteRequestsService) {}

  /** PUBLIC: teklif talebi → DB'ye kalıcı kayıt (rate-limit main.ts'te). */
  @Post()
  create(@Body() dto: CreateQuoteRequestDto) {
    return this.service.create(dto);
  }

  /** Admin: talep listesi. */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  list(@Query("status") status?: string) {
    return this.service.findAll({ status });
  }

  /** Admin: talep durumu güncelle (new | contacted | quoted | closed). */
  @Patch(":id")
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  setStatus(@Param("id") id: string, @Body("status") status: string) {
    return this.service.setStatus(id, status);
  }
}
