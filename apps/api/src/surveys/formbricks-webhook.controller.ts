import { Body, Controller, HttpCode, Post, Query, UnauthorizedException } from "@nestjs/common";
import { ApiExcludeController } from "@nestjs/swagger";
import { SurveysService } from "./surveys.service";

/**
 * Formbricks webhook alıcısı — PUBLIC endpoint (guard yok).
 *
 * Formbricks self-host imza (HMAC) göndermiyor; tek doğrulama yolu paylaşılan
 * gizli anahtar. Anahtar query string'de gelir çünkü Formbricks webhook
 * tanımında özel header alanı yok.
 *
 * FORMBRICKS_WEBHOOK_SECRET tanımlı değilse endpoint kapalıdır (401) —
 * yanlışlıkla korumasız açık kalmasın.
 */
@ApiExcludeController()
@Controller("webhooks")
export class FormbricksWebhookController {
  constructor(private surveys: SurveysService) {}

  @Post("formbricks")
  @HttpCode(200)
  async formbricks(@Body() body: any, @Query("secret") secret?: string) {
    const beklenen = process.env.FORMBRICKS_WEBHOOK_SECRET;
    if (!beklenen || secret !== beklenen) {
      throw new UnauthorizedException();
    }

    // Formbricks birden fazla olay tipi gönderebilir; yalnızca tamamlanmış yanıtı işle.
    if (body?.event && body.event !== "responseFinished") {
      return { ok: true, atlandi: body.event };
    }

    return this.surveys.formbricksYanitKaydet(body);
  }
}
