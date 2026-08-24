import { Body, Controller, Headers, Logger, Post, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MailService } from "../mail/mail.service";
import { SendCartReminderDto } from "./internal-notify.dto";

/**
 * n8n → Markala geri-çağrı uç noktaları. Dışarıya (nginx üzerinden) teoride ulaşılabilir
 * olsa da X-Internal-Secret ile korunur — n8n bu değeri INTERNAL_WEBHOOK_SECRET credential'ı
 * olarak taşır. Amaç: mail gönderimi TEK yerden (Markala'nın kendi MailService/SMTP'si)
 * gitsin, n8n'de ayrı bir mail altyapısı/şablon kurulmasın.
 */
@Controller("internal")
export class InternalNotifyController {
  private readonly logger = new Logger(InternalNotifyController.name);

  constructor(private mail: MailService, private config: ConfigService) {}

  @Post("cart-reminder")
  async cartReminder(@Body() dto: SendCartReminderDto, @Headers("x-internal-secret") secret?: string) {
    const expected = this.config.get<string>("INTERNAL_WEBHOOK_SECRET");
    if (!expected || secret !== expected) {
      this.logger.warn(`cart-reminder: yetkisiz çağrı (secret uyuşmadı) email=${dto?.email ?? "?"}`);
      throw new UnauthorizedException();
    }
    const ok = await this.mail.sendCartReminderEmail(dto.email, dto.items, { name: dto.name, kind: dto.kind });
    return { ok };
  }
}
