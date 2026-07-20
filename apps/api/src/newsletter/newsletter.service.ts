import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHmac, timingSafeEqual } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSubscriberDto } from "./newsletter.dto";

@Injectable()
export class NewsletterService {
  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {}

  /** İdempotent abone: aynı e-posta tekrar gelirse hata değil — status=active'e çeker (e-posta benzersiz). */
  subscribe(dto: CreateSubscriberDto) {
    const email = dto.email.trim().toLowerCase();
    return this.prisma.newsletterSubscriber.upsert({
      where: { email },
      create: { email, source: dto.source || "web", status: "active" },
      update: { status: "active", ...(dto.source ? { source: dto.source } : {}) },
    });
  }

  /** Admin: abone listesi (en yeni önce). */
  findAll(opts: { status?: string } = {}) {
    return this.prisma.newsletterSubscriber.findMany({
      where: opts.status ? { status: opts.status } : {},
      orderBy: { createdAt: "desc" },
      take: 1000,
    });
  }

  /** Çıkış imza anahtarı — ayrı NEWSLETTER_UNSUB_SECRET tanımlıysa o, yoksa JWT_SECRET (main.ts bootstrap'ta zorunlu). */
  private unsubSecret(): string {
    return (
      this.config.get<string>("NEWSLETTER_UNSUB_SECRET") ?? this.config.get<string>("JWT_SECRET") ?? ""
    );
  }

  /**
   * Deterministik çıkış token'ı — HMAC-SHA256(email, secret) hex (payment-nonce deseni).
   * DB'de saklanmaz; doğrulama yeniden hesaplanarak yapılır. Secret olmadan üretilemez →
   * saldırgan başkasının e-postasını bilse bile onu listeden çıkaramaz.
   */
  unsubscribeToken(email: string): string {
    return createHmac("sha256", this.unsubSecret()).update(email.trim().toLowerCase()).digest("hex");
  }

  /** Sabit-zamanlı token karşılaştırması. */
  private verifyUnsubscribeToken(email: string, token: string): boolean {
    const expected = Buffer.from(this.unsubscribeToken(email));
    const provided = Buffer.from(token);
    if (expected.length !== provided.length) return false;
    return timingSafeEqual(expected, provided);
  }

  /**
   * PUBLIC çıkış (ETK): token geçerliyse status="unsubscribed". Yanıt DAİMA { ok:true } —
   * abone var/yok ya da token doğru/yanlış sızdırılmaz (auth'taki enumeration korumasıyla tutarlı).
   */
  async unsubscribe(emailRaw: string, token: string) {
    const email = emailRaw.trim().toLowerCase();
    if (this.verifyUnsubscribeToken(email, token)) {
      // updateMany: kayıt yoksa hata fırlatmaz — enumeration'a kapalı kalır.
      await this.prisma.newsletterSubscriber.updateMany({
        where: { email },
        data: { status: "unsubscribed" },
      });
    }
    return { ok: true };
  }

  /** Kampanya maillerine eklenecek tek-tık çıkış linki — WEB_URL tabanlı /bulten-cikis sayfası. */
  buildUnsubscribeUrl(email: string): string {
    const webUrl = (this.config.get<string>("WEB_URL") ?? "https://markala.com.tr").replace(/\/$/, "");
    const norm = email.trim().toLowerCase();
    return `${webUrl}/bulten-cikis?email=${encodeURIComponent(norm)}&token=${this.unsubscribeToken(norm)}`;
  }
}
