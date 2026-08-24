import { Body, Controller, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { CartLeadsService } from "./cart-leads.service";
import { CreateCartLeadDto } from "./cart-leads.dto";

@ApiTags("cart-leads")
@Controller("cart-leads")
export class CartLeadsController {
  constructor(private service: CartLeadsService) {}

  /** PUBLIC: sepet sayfasındaki e-posta yakalama kutusu (rate-limit main.ts'te). */
  @Post()
  create(@Body() dto: CreateCartLeadDto, @Req() req: Request) {
    return this.service.create(dto, req.ip, req.headers["user-agent"]);
  }
}
