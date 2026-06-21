import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { NewsletterService } from "./newsletter.service";
import { CreateSubscriberDto } from "./newsletter.dto";
import { JwtAuthGuard } from "../auth/jwt.guard";
import { RolesGuard, Roles } from "../auth/roles.guard";

@ApiTags("newsletter")
@Controller("newsletter-subscribers")
export class NewsletterController {
  constructor(private service: NewsletterService) {}

  /** PUBLIC: bülten aboneliği → DB'ye kalıcı (rate-limit main.ts'te). SMTP'den bağımsız. */
  @Post()
  subscribe(@Body() dto: CreateSubscriberDto) {
    return this.service.subscribe(dto);
  }

  /** Admin: abone listesi. */
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles("admin", "super_admin")
  @ApiBearerAuth()
  list(@Query("status") status?: string) {
    return this.service.findAll({ status });
  }
}
