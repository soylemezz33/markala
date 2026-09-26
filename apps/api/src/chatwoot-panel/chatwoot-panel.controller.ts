import {
  BadRequestException,
  Body,
  Controller,
  Get,
  InternalServerErrorException,
  Logger,
  Post,
  Query,
  Req,
  Res,
  UnauthorizedException,
} from "@nestjs/common";
import type { Request, Response } from "express";
import { timingSafeEqual } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { ChatwootPanelService } from "./chatwoot-panel.service";
import { PanelOturumDto } from "./chatwoot-panel.dto";

/**
 * Chatwoot "Panel Uygulamaları" (Dashboard App) iframe'i — konuşma ekranının sağ panelinde
 * müşteri + son siparişler. SALT OKUNUR: ne Chatwoot'a ne markala'ya bir şey yazar.
 *
 * Bu projede global JwtAuthGuard YOK (guard'lar controller başına veriliyor) → @Public gerekmez;
 * erişim, Chatwoot ayarındaki URL'e gömülü paylaşılan anahtarla (CHATWOOT_PANEL_KEY) korunur.
 * Global prefix "api" olduğu için gerçek yollar: /api/chatwoot-panel ve /api/chatwoot-panel/lookup
 */

/**
 * panel.html derlemeye TypeScript olarak girmez; nest-cli.json → compilerOptions.assets ile
 * dist'e kopyalanır. Dosya okuması bilerek ilk istekte yapılır: modül yüklenirken okunsaydı
 * (asset kopyalanmayan bir derlemede) TÜM API boot'ta çökerdi — hata yalnız bu uca kalsın.
 */
let cachedHtml: string | null = null;
function loadHtml(): string {
  if (cachedHtml) return cachedHtml;
  const candidates = [
    join(__dirname, "panel.html"),
    join(process.cwd(), "src/chatwoot-panel/panel.html"),
  ];
  const hit = candidates.find((p) => existsSync(p));
  if (!hit) {
    Logger.error(
      `panel.html bulunamadı (${candidates.join(" · ")}) — nest-cli.json assets kaydını kontrol edin`,
      "ChatwootPanel",
    );
    throw new InternalServerErrorException("panel.html yok");
  }
  cachedHtml = readFileSync(hit, "utf8");
  return cachedHtml;
}

/** Sayfaya gömülen yapılandırma — hepsi .env'den. {id} / {q} yer tutucuları istemcide doldurulur. */
function pageConfig() {
  return {
    chatwootOrigin: process.env.CHATWOOT_ORIGIN ?? "", // https://chat.324ajans.com — boşsa origin kontrolü yapılmaz
    markalaInboxes: (process.env.CHATWOOT_MARKALA_INBOXES ?? "")
      .split(",")
      .map((s) => parseInt(s.trim(), 10))
      .filter(Number.isFinite), // "5" → [5]; boşsa tüm inbox'larda çalışır
    panel: {
      order: process.env.CHATWOOT_PANEL_ORDER_URL ?? "", // https://admin.markala.com.tr/siparisler/{id}
      customer: process.env.CHATWOOT_PANEL_CUSTOMER_URL ?? "", // https://admin.markala.com.tr/musteriler/{id}
      search: process.env.CHATWOOT_PANEL_SEARCH_URL ?? "", // https://admin.markala.com.tr/musteriler?q={q}
    },
  };
}

function keyOk(k?: string): boolean {
  const expected = process.env.CHATWOOT_PANEL_KEY ?? "";
  if (!expected || !k || k.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(k), Buffer.from(expected));
}

@Controller("chatwoot-panel")
export class ChatwootPanelController {
  constructor(private readonly svc: ChatwootPanelService) {}

  /** Chatwoot'un iframe'de açtığı kabuk sayfa. Veri içermez; anahtar doğrulaması lookup'ta yapılır. */
  @Get()
  page(@Res({ passthrough: true }) res: Response): string {
    const origin = process.env.CHATWOOT_ORIGIN ?? "";
    const html = loadHtml();
    res.removeHeader("X-Frame-Options"); // helmet/nginx koyduysa iframe'i engeller
    res.setHeader("Content-Security-Policy", `frame-ancestors 'self'${origin ? " " + origin : ""}`);
    // helmet varsayılanı CORP: same-origin — bu başlık kalırsa tarayıcı sayfayı çapraz-origin
    // iframe'e (chat.324ajans.com) YÜKLEMEZ. /uploads mount'undaki aynı gerekçe.
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("X-Robots-Tag", "noindex");
    const cfg = JSON.stringify(pageConfig()).replace(/</g, "\\u003c");
    return html.replace("__CONFIG__", cfg);
  }

  /**
   * Ajan girişi: paylaşılan anahtar + KENDİ panel hesabı → uzun ömürlü access token.
   * Bundan sonraki işlem istekleri (durum, not, takip, tasarım) doğrudan /orders uçlarına
   * bu token'la gider; yetki sınırı orada, mevcut RolesGuard/@Perms ile çizilir.
   */
  @Post("oturum")
  async oturum(@Query("k") k: string, @Body() dto: PanelOturumDto, @Req() req: Request) {
    if (!keyOk(k)) throw new UnauthorizedException();
    return this.svc.oturumAc(dto.email, dto.password, {
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });
  }

  /** Telefon → müşteri + son siparişler. Yalnızca paylaşılan anahtarla; salt okunur. */
  @Get("lookup")
  async lookup(
    @Query("phone") phone: string,
    @Query("k") k: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (!keyOk(k)) throw new UnauthorizedException();
    if (!phone) throw new BadRequestException("phone gerekli");
    res.setHeader("Cache-Control", "no-store");
    return this.svc.lookup(phone);
  }
}
