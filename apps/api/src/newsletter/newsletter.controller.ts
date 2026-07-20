import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { NewsletterService } from "./newsletter.service";
import { CreateSubscriberDto, UnsubscribeQueryDto } from "./newsletter.dto";
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

/** Public bülten rotaları — kampanya maillerindeki tek-tık linkler (girişsiz). */
@ApiTags("newsletter")
@Controller("newsletter")
export class NewsletterPublicController {
  constructor(private service: NewsletterService) {}

  /**
   * PUBLIC: bülten çıkışı (ETK) — token = HMAC-SHA256(email); rate-limit main.ts'te.
   * Daima { ok:true } döner — abone var/yok sızdırılmaz (enumeration koruması).
   */
  @Get("unsubscribe")
  unsubscribe(@Query() query: UnsubscribeQueryDto) {
    return this.service.unsubscribe(query.email, query.token);
  }
}
