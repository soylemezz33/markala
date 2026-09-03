import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Cron, CronExpression } from "@nestjs/schedule";
import * as nodemailer from "nodemailer";
import { PrismaService } from "../prisma/prisma.service";

/**
 * E-posta gönderim sağlığı + arıza uyarısı (2026-09-03, Hasan: "giden bir email başarısız
 * olduğunda bunu bilmem lazım ki erken aksiyon alayım").
 *
 * OLAY: hosting'de SMTP şifresi değişti, 12:42-15:05 arası 25 mail sessizce kayboldu; kimse
 * fark etmedi çünkü uygulama fire-and-forget gönderiyor ve arızayı yalnız log'a yazıyordu.
 *
 * ÜÇ KATMAN:
 *  1) GET /api/health/mail — herkese açık, gizli veri yok; son 15 dk'da başarısız var ve
 *     sonrasında başarılı yoksa 503. Harici izleme (UptimeRobot vb.) buna bağlanır → SMS/push.
 *  2) Panel şeridi — admin BFF aynı ucu okur, her sayfada kırmızı "E-posta gönderimi arızalı".
 *  3) Anlık bildirim — ilk hatada (30 dk'da en çok bir kez) MAIL_ALERT_WEBHOOK_URL'e (n8n →
 *     WhatsApp/Telegram) POST ve/veya ALERT_SMTP_* ile BAŞKA bir posta sunucusundan e-posta
 *     (birincil SMTP bozukken kendi üzerinden uyarı gidemez). Düzelince tek "düzeldi" mesajı.
 *
 * Durum kaynağı DB (notification_logs) — yeniden başlatmada kaybolmaz; debounce bellekte.
 */

export const ARIZA_PENCERESI_MS = 15 * 60 * 1000;
export const UYARI_ARALIGI_MS = 30 * 60 * 1000;

export interface MailDurumu {
  ok: boolean;
  lastFailureAt: string | null;
  lastSentAt: string | null;
  failedLast15m: number;
  lastError: string | null;
}

/** Saf karar: son hata/başarı zamanlarına göre "arızalı mı?" (testte doğrudan). */
export function arizaliMi(input: { lastFailureAt: Date | null; lastSentAt: Date | null; now?: Date }): boolean {
  const now = input.now ?? new Date();
  if (!input.lastFailureAt) return false;
  if (now.getTime() - input.lastFailureAt.getTime() > ARIZA_PENCERESI_MS) return false;
  // Hatadan SONRA başarılı gönderim olduysa arıza geçmiş demektir.
  return !(input.lastSentAt && input.lastSentAt > input.lastFailureAt);
}

/** Saf karar: yeni bir hata geldi — uyarı gönderilsin mi? (debounce: 30 dk'da bir) */
export function uyariGerekliMi(input: { lastAlertAt: number | null; now: number }): boolean {
  return input.lastAlertAt === null || input.now - input.lastAlertAt >= UYARI_ARALIGI_MS;
}

@Injectable()
export class MailHealthService {
  private readonly logger = new Logger(MailHealthService.name);
  private lastAlertAt: number | null = null;
  private arizada = false;

  constructor(private config: ConfigService, private prisma: PrismaService) {}

  /** MailService.logNotification her kayıttan sonra çağırır. Asla fırlatmaz. */
  async kaydet(status: "sent" | "failed" | "skipped", info: { recipient: string; subject?: string; error?: string }): Promise<void> {
    try {
      if (status === "failed") {
        const now = Date.now();
        if (uyariGerekliMi({ lastAlertAt: this.lastAlertAt, now })) {
          this.lastAlertAt = now;
          this.arizada = true;
          const d = await this.durum();
          await this.uyar(
            `⚠️ Markala e-posta gönderimi ARIZALI`,
            `Son hata: ${info.error ?? "?"}\nAlıcı: ${info.recipient}\nKonu: ${info.subject ?? "-"}\nSon 15 dk başarısız: ${d.failedLast15m}\n\nMüşteri mailleri şu an gitmiyor; SMTP şifresi/hesabı hosting'de kontrol edilmeli. Panel → E-posta Kayıtları.`,
            { tur: "mail_arizasi", ...d, recipient: info.recipient, error: info.error ?? null },
          );
        }
      } else if (status === "sent" && this.arizada) {
        this.arizada = false;
        this.lastAlertAt = null;
        await this.uyar(
          `✅ Markala e-posta gönderimi DÜZELDİ`,
          `Başarılı gönderim: ${info.recipient} · ${info.subject ?? "-"}. Arıza sırasında kaybolan mailler panel → E-posta Kayıtları'nda "failed" olarak listelenir; yeniden gönderilmesi gerekebilir.`,
          { tur: "mail_duzeldi", recipient: info.recipient },
        );
      }
    } catch (e) {
      this.logger.warn(`mail-health kaydet: ${(e as Error).message}`);
    }
  }

  /**
   * Saatlik kontrol (Hasan, 2026-09-03: "saatlik olarak atsın"): arıza sürdüğü her saat uyarı
   * yenilenir — ilk hata bildirimi kaçmış/okunmamışsa kimse habersiz kalmasın. Debounce'u ATLAR
   * (saatte bir zaten). Sağlıklıyken sessizdir; düzelme mesajını kaydet() üretir.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async saatlikKontrol(): Promise<void> {
    try {
      const d = await this.durum();
      if (d.ok) return;
      this.arizada = true;
      this.lastAlertAt = Date.now();
      await this.uyar(
        `⚠️ Markala e-posta gönderimi HÂLÂ ARIZALI (saatlik kontrol)`,
        `Son hata: ${d.lastError ?? "?"} (${d.lastFailureAt ?? "?"})\nSon 15 dk başarısız: ${d.failedLast15m}\nSon başarılı gönderim: ${d.lastSentAt ?? "yok"}\n\nSMTP şifresi/hesabı hosting'de kontrol edilmeli. Panel → E-posta Kayıtları.`,
        { tur: "mail_arizasi_saatlik", ...d },
      );
    } catch (e) {
      this.logger.warn(`mail-health saatlik kontrol: ${(e as Error).message}`);
    }
  }

  /** DB'den anlık durum — GET /health/mail ve panel şeridi. */
  async durum(): Promise<MailDurumu> {
    const since = new Date(Date.now() - ARIZA_PENCERESI_MS);
    const [sonHata, sonBasari, sayi] = await Promise.all([
      this.prisma.notificationLog.findFirst({ where: { status: "failed" }, orderBy: { createdAt: "desc" }, select: { createdAt: true, metadata: true } }),
      this.prisma.notificationLog.findFirst({ where: { status: "sent" }, orderBy: { createdAt: "desc" }, select: { createdAt: true } }),
      this.prisma.notificationLog.count({ where: { status: "failed", createdAt: { gte: since } } }),
    ]);
    const meta = (sonHata?.metadata ?? null) as { error?: string } | null;
    return {
      ok: !arizaliMi({ lastFailureAt: sonHata?.createdAt ?? null, lastSentAt: sonBasari?.createdAt ?? null }),
      lastFailureAt: sonHata?.createdAt?.toISOString() ?? null,
      lastSentAt: sonBasari?.createdAt?.toISOString() ?? null,
      failedLast15m: sayi,
      // Gizli veri sızmasın: hata metninin yalnız başı (535 Authentication failed vb.).
      lastError: typeof meta?.error === "string" ? meta.error.slice(0, 120) : null,
    };
  }

  /** Webhook (n8n → WhatsApp/Telegram) ve/veya yedek SMTP. İkisi de tanımsızsa yalnız log. */
  private async uyar(baslik: string, metin: string, payload: Record<string, unknown>): Promise<void> {
    const webhook = (this.config.get<string>("MAIL_ALERT_WEBHOOK_URL") ?? "").trim();
    const host = (this.config.get<string>("ALERT_SMTP_HOST") ?? "").trim();
    const to = (this.config.get<string>("ALERT_TO") ?? "").trim();
    let gitti = false;
    if (webhook) {
      try {
        const r = await fetch(webhook, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ baslik, metin, ...payload, zaman: new Date().toISOString() }) });
        gitti = r.ok || gitti;
        if (!r.ok) this.logger.warn(`mail-health webhook HTTP ${r.status}`);
      } catch (e) {
        this.logger.warn(`mail-health webhook gönderilemedi: ${(e as Error).message}`);
      }
    }
    if (host && to) {
      try {
        const t = nodemailer.createTransport({
          host,
          port: Number(this.config.get<string>("ALERT_SMTP_PORT") ?? "465"),
          secure: (this.config.get<string>("ALERT_SMTP_SECURE") ?? "true") === "true",
          auth: { user: this.config.get<string>("ALERT_SMTP_USER"), pass: this.config.get<string>("ALERT_SMTP_PASS") },
          connectionTimeout: 10000,
        });
        await t.sendMail({ from: this.config.get<string>("ALERT_FROM") ?? this.config.get<string>("ALERT_SMTP_USER"), to, subject: baslik, text: metin });
        gitti = true;
      } catch (e) {
        this.logger.warn(`mail-health yedek SMTP uyarısı gönderilemedi: ${(e as Error).message}`);
      }
    }
    this.logger[gitti ? "log" : "error"](`${baslik} — ${gitti ? "uyarı iletildi" : "UYARI KANALI YOK (MAIL_ALERT_WEBHOOK_URL / ALERT_SMTP_* tanımsız)"}: ${metin.split("\n")[0]}`);
  }
}
