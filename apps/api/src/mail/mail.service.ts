import { Injectable, Logger, Optional } from "@nestjs/common";
import { MailHealthService } from "./mail-health.service";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { PrismaService } from "../prisma/prisma.service";
import { renderEmail, emailButton, emailButtonColored, emailFallbackLink } from "./email-layout";
import { BANKA_HESABI, ODEME_YONTEMI } from "../common/banka";

/**
 * Konfigürasyon özetindeki paket adedini çıkarır ("2 Adet" → 2, "1.000 Adet" → 1000).
 * Görünen adet = satır adedi × paket adedi — web/admin ile aynı kural (2026-08-29).
 */
function birimAdet(summary: string | undefined | null): number {
  if (!summary) return 1;
  const m = summary.match(/(\d[\d.]*)\s*adet/i);
  if (!m || !m[1]) return 1;
  const n = Number(m[1].replace(/\./g, ""));
  return Number.isInteger(n) && n >= 1 ? n : 1;
}


@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly from: string;
  private transporter: Transporter;

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
    // Arıza uyarısı (2026-09-03). @Optional + son parametre: spec'ler iki argümanla kuruyor.
    @Optional() private health?: MailHealthService,
  ) {
    const secure = (this.config.get<string>("SMTP_SECURE") ?? "false") === "true";
    const user = this.config.get<string>("SMTP_USER");
    const pass = this.config.get<string>("SMTP_PASS");
    // Fallback DAİMA markala.com.tr olmalı: DMARC aspf=s (strict) — 324ajans.com From'u
    // markala SPF'iyle hizalanmaz, env düşerse tüm mailler karantinaya gider.
    this.from = this.config.get<string>("MAIL_FROM") ?? "Markala <bilgi@markala.com.tr>";
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>("SMTP_HOST") ?? "localhost",
      port: Number(this.config.get<string>("SMTP_PORT") ?? 1025),
      secure,
      auth: user ? { user, pass } : undefined,
      connectionTimeout: 10_000,
      greetingTimeout: 10_000,
      socketTimeout: 10_000,
      // markala maili Lisan Fen ortak mail sunucusunda barınıyor; sunucu GEÇERLİ
      // Let's Encrypt sertifikasını "mail.lisanfen.k12.tr" adına sunuyor. Bağlantı
      // mail.markala.com.tr'ye gider ama TLS doğrulaması gerçek sertifika adına yapılır
      // → rejectUnauthorized AÇIK kalır (MITM koruması korunur), hostname-mismatch çözülür.
      tls: { servername: "mail.lisanfen.k12.tr" },
    });
  }

  /** İşlemsel doğrulama maili. HATA FIRLATMAZ — register'ı bloke etmez. */
  async sendVerificationEmail(to: string, verifyUrl: string): Promise<boolean> {
    const subject = "Markala - E-posta adresinizi doğrulayın";
    const text = `Markala hesabınızı etkinleştirmek için bağlantıya tıklayın:\n${verifyUrl}\n\nBağlantı 24 saat geçerlidir. Bu işlemi siz başlatmadıysanız e-postayı yok sayın.\n\nMarkala, 324 Ajans BT tarafından gönderilmiştir (işlemsel ileti).`;
    const html = renderEmail({
      title: "Markala'ya hoş geldiniz 👋",
      intro: "Hesabınızı etkinleştirmek için e-posta adresinizi doğrulayın.",
      preheader: "E-posta adresinizi doğrulayın, bağlantı 24 saat geçerli.",
      bodyHtml: `<p style="margin:0">Hesabınızı etkinleştirmek için aşağıdaki butona tıklayın:</p>
        ${emailButton("E-postamı doğrula", verifyUrl)}
        ${emailFallbackLink(verifyUrl)}
        <p style="margin:14px 0 0;color:#78716c;font-size:13px">Bağlantı 24 saat geçerlidir. Bu işlemi siz başlatmadıysanız e-postayı yok sayın.</p>`,
    });

    try {
      const info = await this.transporter.sendMail({ from: this.from, to, subject, text, html });
      await this.logNotification(to, "sent", { messageId: info.messageId }, subject);
      return true;
    } catch (err) {
      this.logger.warn(`mail.verification failed to=${to}: ${(err as Error).message}`);
      await this.logNotification(to, "failed", { error: (err as Error).message }, subject);
      return false;
    }
  }

  /** Şifre sıfırlama maili. HATA FIRLATMAZ — akışı bloke etmez (enumeration koruması için sessiz başarı). */
  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
    const subject = "Markala - Şifre sıfırlama talebi";
    const text = `Markala hesabınızın şifresini sıfırlamak için bağlantıya tıklayın:\n${resetUrl}\n\nBağlantı 1 saat geçerlidir. Bu talebi siz oluşturmadıysanız e-postayı yok sayın; şifreniz değişmez.\n\nMarkala, 324 Ajans BT tarafından gönderilmiştir (işlemsel ileti).`;
    const html = renderEmail({
      title: "Şifre Sıfırlama",
      intro: "Markala hesabınızın şifresini sıfırlama talebi aldık.",
      preheader: "Şifre sıfırlama bağlantısı, 1 saat geçerli.",
      bodyHtml: `<p style="margin:0">Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
        ${emailButton("Şifremi sıfırla", resetUrl)}
        ${emailFallbackLink(resetUrl)}
        <p style="margin:14px 0 0;color:#78716c;font-size:13px">Bağlantı 1 saat geçerlidir. Bu talebi siz oluşturmadıysanız bu e-postayı yok sayın, şifreniz değişmez.</p>`,
    });

    try {
      const info = await this.transporter.sendMail({ from: this.from, to, subject, text, html });
      await this.logNotification(to, "sent", { messageId: info.messageId, template: "password-reset" }, subject);
      return true;
    } catch (err) {
      this.logger.warn(`mail.passwordReset failed to=${to}: ${(err as Error).message}`);
      await this.logNotification(to, "failed", { error: (err as Error).message, template: "password-reset" }, subject);
      return false;
    }
  }

  /** Kurumsal başvuru onayında: hesabı aktive et + şifre belirleme (davet) bağlantısı. */
  async sendCorporateInviteEmail(to: string, inviteUrl: string, companyName: string): Promise<boolean> {
    // companyName kullanıcı-kontrollü (başvuru formu) → HTML injection'a karşı escape et.
    const safeCompany = String(companyName)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const subject = "Markala - Kurumsal hesabınız onaylandı";
    const text = `${companyName} kurumsal hesabınız onaylandı. Panele giriş için önce şifrenizi belirleyin:\n${inviteUrl}\n\nBağlantı 7 gün geçerlidir.\n\nMarkala, 324 Ajans BT (işlemsel ileti).`;
    const html = renderEmail({
      title: "Kurumsal Hesabınız Onaylandı 🎉",
      intro: `${safeCompany} için kurumsal hesabınız aktif edildi.`,
      preheader: "Kurumsal hesabınız onaylandı, şifrenizi belirleyin.",
      bodyHtml: `<p style="margin:0">Panele giriş yapmak için önce şifrenizi belirleyin:</p>
        ${emailButton("Şifremi belirle ve giriş yap", inviteUrl)}
        ${emailFallbackLink(inviteUrl)}
        <p style="margin:14px 0 0;color:#78716c;font-size:13px">Bağlantı 7 gün geçerlidir. Giriş sonrası firmanıza özel fiyatlarınız, sipariş geçmişiniz ve hesabınız tek panelde.</p>`,
    });

    try {
      const info = await this.transporter.sendMail({ from: this.from, to, subject, text, html });
      await this.logNotification(to, "sent", { messageId: info.messageId, template: "corporate-invite" }, subject);
      return true;
    } catch (err) {
      this.logger.warn(`mail.corporateInvite failed to=${to}: ${(err as Error).message}`);
      await this.logNotification(to, "failed", { error: (err as Error).message, template: "corporate-invite" }, subject);
      return false;
    }
  }

  /**
   * Cari hesap (B2B) AYLIK ekstre özeti maili — otomatik aylık faturalama sonrası gönderilir.
   * HATA FIRLATMAZ — faturalama akışını bloke etmez.
   */
  async sendCorporateMonthlyStatementEmail(input: {
    to: string;
    companyName: string;
    period: string; // "YYYY-MM"
    orders: Array<{ orderNumber: string; date: string; amount: number }>;
    total: number;
    invoiceIssued: boolean;
  }): Promise<boolean> {
    const esc = (s: string) =>
      String(s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const fmt = (n: number) =>
      new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n);

    const subject = `Markala - ${input.period} dönemi cari hesap ekstresi`;
    const rowsText = input.orders
      .map((o) => `  • ${o.orderNumber} (${o.date}) - ${fmt(o.amount)} ₺`)
      .join("\n");
    const invoiceNote = input.invoiceIssued
      ? "Bu döneme ait e-faturanız Paraşüt üzerinden düzenlenmiştir."
      : "Bu döneme ait fatura kaydı oluşturulmuştur.";
    const text =
      `${input.companyName} - ${input.period} dönemi açık hesap (cari) ekstresi:\n\n` +
      `${rowsText}\n\n` +
      `Toplam: ${fmt(input.total)} ₺ (${input.orders.length} sipariş)\n\n` +
      `${invoiceNote}\n\nMarkala, 324 Ajans BT tarafından gönderilmiştir.`;

    const rowsHtml = input.orders
      .map(
        (o) =>
          `<tr><td style="padding:6px 8px;border-bottom:1px solid #eee">${esc(o.orderNumber)}</td>` +
          `<td style="padding:6px 8px;border-bottom:1px solid #eee">${esc(o.date)}</td>` +
          `<td style="padding:6px 8px;border-bottom:1px solid #eee;text-align:right">${fmt(o.amount)} ₺</td></tr>`,
      )
      .join("");
    const html = renderEmail({
      title: `${esc(input.period)} Dönemi Cari Hesap Ekstresi`,
      intro: `${esc(input.companyName)}, açık hesap (cari) sipariş özeti`,
      preheader: `${esc(input.period)} ekstresi, toplam ${fmt(input.total)} ₺`,
      bodyHtml: `<p style="margin:0 0 12px"><strong>${esc(input.companyName)}</strong> için açık hesap (cari) siparişlerinizin ${esc(input.period)} dönemi özeti:</p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;font-size:14px">
          <thead><tr>
            <th style="padding:8px;text-align:left;border-bottom:2px solid #1A1410;color:#1A1410">Sipariş</th>
            <th style="padding:8px;text-align:left;border-bottom:2px solid #1A1410;color:#1A1410">Tarih</th>
            <th style="padding:8px;text-align:right;border-bottom:2px solid #1A1410;color:#1A1410">Tutar</th>
          </tr></thead>
          <tbody>${rowsHtml}</tbody>
          <tfoot><tr>
            <td colspan="2" style="padding:10px 8px;text-align:right;font-weight:600">Toplam (${input.orders.length} sipariş)</td>
            <td style="padding:10px 8px;text-align:right;font-weight:700;color:#1A1410">${fmt(input.total)} ₺</td>
          </tr></tfoot>
        </table>
        <p style="margin:16px 0 0;color:#78716c;font-size:13px">${invoiceNote}</p>`,
    });

    try {
      const info = await this.transporter.sendMail({ from: this.from, to: input.to, subject, text, html });
      await this.logNotification(input.to, "sent", { messageId: info.messageId, template: "corporate-monthly-statement", period: input.period }, subject);
      return true;
    } catch (err) {
      this.logger.warn(`mail.corporateMonthlyStatement failed to=${input.to}: ${(err as Error).message}`);
      await this.logNotification(input.to, "failed", { error: (err as Error).message, template: "corporate-monthly-statement", period: input.period }, subject);
      return false;
    }
  }

  /**
   * MÜŞTERİYE sipariş onay maili — ödeme başarısında (paid) veya cari sipariş oluşturulduğunda
   * gönderilir. orderId ile siparişi + kalemleri çeker, KDV-dahil özet + tutar tablosu yollar.
   * HATA FIRLATMAZ — sipariş/ödeme akışını bloke etmez (fire-and-forget güvenli).
   */
  /** aliciOverride: yalnız admin mail-önizleme testinde dolu — müşteriye DEĞİL, verilen adrese gider. */
  async sendOrderConfirmationEmail(orderId: string, aliciOverride?: string): Promise<boolean> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: { select: { fullName: true } } },
    });
    if (!order || !order.email) {
      this.logger.warn(`mail.orderConfirmation: sipariş/e-posta yok order=${orderId}`);
      return false;
    }
    const esc = (s: unknown) =>
      String(s ?? "")
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const fmt = (n: unknown) =>
      new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);

    const isCari = order.paymentMethod === "cari";
    // Havale siparişinde para HENÜZ GELMEDİ — "ödemeniz alındı" YAZILMAZ; onun
    // yerine hesap bilgileri ve sipariş no (açıklamaya yazılacak referans) verilir.
    const isHavale = order.paymentMethod === ODEME_YONTEMI.havale;
    const name = (order.user?.fullName?.trim() || (order.shippingAddressSnapshot as { fullName?: string } | null)?.fullName?.trim()) ?? undefined;
    const greeting = name ? `Merhaba ${esc(name)},` : "Merhaba,";
    const webUrl = (this.config.get<string>("WEB_URL") ?? "https://markala.com.tr").replace(/\/$/, "");
    const orderUrl = `${webUrl}/hesabim/siparislerim`;

    // Yeni tasarım (2026-08-29, Hasan onayı): satırlarda ürün küçük görseli + tıklanabilir ad.
    // Görsel remote URL'dir (üretim SMTP'si img'leri korur); görseli olmayan kalemde hücre boş kalır.
    const webBase = webUrl;
    const rowsHtml = (order.items ?? [])
      .map(
        (i) =>
          `<tr><td style="padding:12px 8px;border-bottom:1px solid #eee;width:64px;vertical-align:top">` +
          (i.productImage
            ? `<img src="${esc(i.productImage)}" width="56" height="56" alt="${esc(i.productName)}" style="display:block;width:56px;height:56px;border-radius:8px;border:1px solid #e7e5e4">`
            : "") +
          `</td>` +
          `<td style="padding:12px 8px;border-bottom:1px solid #eee;vertical-align:top">` +
          (i.productSlug
            ? `<a href="${webBase}/urun/${esc(i.productSlug)}" style="color:#1A1410;font-weight:700;text-decoration:none">${esc(i.productName)}</a>`
            : `<strong>${esc(i.productName)}</strong>`) +
          `${i.configurationSummary ? `<br><span style="color:#a8a29e;font-size:12px">${esc(i.configurationSummary)}</span>` : ""}` +
          `<br><span style="color:#78716c;font-size:12px">Adet: ${i.quantity * birimAdet(i.configurationSummary)}</span></td>` +
          `<td style="padding:12px 8px;border-bottom:1px solid #eee;text-align:right;vertical-align:top;white-space:nowrap"><strong>${fmt(i.lineTotal)} ₺</strong></td></tr>`,
      )
      .join("");

    const totalsHtml =
      `<tr><td colspan="2" style="padding:4px 8px;text-align:right;color:#78716c">Ara toplam</td><td style="padding:4px 8px;text-align:right">${fmt(order.subtotal)} ₺</td></tr>` +
      (Number(order.discount) > 0
        ? `<tr><td colspan="2" style="padding:4px 8px;text-align:right;color:#16a34a">İndirim</td><td style="padding:4px 8px;text-align:right;color:#16a34a">-${fmt(order.discount)} ₺</td></tr>`
        : "") +
      `<tr><td colspan="2" style="padding:4px 8px;text-align:right;color:#78716c">Kargo</td><td style="padding:4px 8px;text-align:right">${Number(order.shippingFee) > 0 ? fmt(order.shippingFee) + " ₺" : "Ücretsiz"}</td></tr>` +
      `<tr><td colspan="2" style="padding:4px 8px;text-align:right;color:#78716c">Ödeme yöntemi</td><td style="padding:4px 8px;text-align:right;white-space:nowrap">${isCari ? "Açık Hesap (Cari)" : "Kart (iyzico · 3D)"}</td></tr>` +
      `<tr><td colspan="2" style="padding:8px;text-align:right;font-weight:700;border-top:2px solid #1A1410">Toplam (KDV dahil)</td><td style="padding:8px;text-align:right;font-weight:700;border-top:2px solid #1A1410">${fmt(order.total)} ₺</td></tr>`;

    // Teslimat/fatura adres kartları (yeni tasarım) — snapshot JSON'larından; yoksa blok atlanır.
    type AdresSnap = { fullName?: string; fullAddress?: string; district?: string; city?: string } | null;
    const adresKart = (baslik: string, a: AdresSnap) =>
      a && (a.fullAddress || a.fullName)
        ? `<td width="50%" style="background:#FAFAF9;border:1px solid #e7e5e4;border-radius:8px;padding:12px 14px;vertical-align:top">
            <p style="margin:0 0 4px;font-size:11px;color:#a8a29e;font-weight:700;letter-spacing:0.5px">${baslik}</p>
            <p style="margin:0;font-size:13px;color:#1A1410;line-height:1.5">${esc(a.fullName ?? "")}${a.fullName ? "<br>" : ""}${esc(a.fullAddress ?? "")}${(a.district || a.city) && !(a.fullAddress ?? "").includes(a.city ?? " ") ? `<br>${esc(a.district ?? "")}${a.district && a.city ? " / " : ""}${esc(a.city ?? "")}` : ""}</p>
          </td>`
        : "";
    const teslimat = adresKart("TESLİMAT ADRESİ", order.shippingAddressSnapshot as AdresSnap);
    const fatura = adresKart("FATURA ADRESİ", (order.billingAddressSnapshot ?? order.shippingAddressSnapshot) as AdresSnap);
    const adresBlok =
      teslimat || fatura
        ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;border-spacing:8px 0;margin:14px -8px 0"><tr>${teslimat}${fatura}</tr></table>`
        : "";
    // Yasal bağlantılar (mesafeli satışta kalıcı bilgilendirme — İtopya kıyası, 2026-08-29)
    const yasalBlok = `<p style="margin:12px 0 0;font-size:12px;color:#78716c;line-height:1.7">
        <a href="${webUrl}/yasal/on-bilgilendirme" style="color:#5C4100">Ön Bilgilendirme Formu</a> ·
        <a href="${webUrl}/yasal/mesafeli-satis" style="color:#5C4100">Mesafeli Satış Sözleşmesi</a> ·
        <a href="${webUrl}/yasal/iade-iptal" style="color:#5C4100">İptal &amp; İade Süreçleri</a>
      </p>`;

    const statusNote = isCari
      ? "Siparişiniz <strong>açık hesap (cari)</strong> ile alınmıştır; ay sonunda faturalandırılır."
      : isHavale
        ? "Siparişiniz <strong>havale/EFT</strong> ile alındı. Ödemeniz hesabımıza geçtiğinde onaylayıp üretime alacağız."
        : "Ödemeniz alınmıştır, siparişiniz onaylandı.";

    /**
     * Havale hesap bloğu — sipariş numarası AÇIKLAMAYA yazılmalı; ödemeyi siparişle
     * eşleştirmenin tek yolu bu. Tutar, %5 havale indirimi uygulanmış GENEL TOPLAM.
     */
    const havaleHtml = isHavale
      ? `<div style="margin:16px 0 0;padding:14px;background:#F7F5F0;border:1px solid #E7E2D8;border-radius:10px">
        <p style="margin:0 0 10px;font-weight:600;color:#1A1410">Havale/EFT bilgileri</p>
        <p style="margin:0;font-size:14px;color:#44403c;line-height:1.9">
          <strong style="color:#1A1410">Alıcı:</strong> ${BANKA_HESABI.unvan}<br>
          <strong style="color:#1A1410">Banka:</strong> ${BANKA_HESABI.banka}<br>
          <strong style="color:#1A1410">IBAN:</strong> <span style="font-family:monospace;font-size:15px">${BANKA_HESABI.iban}</span><br>
          <strong style="color:#1A1410">Tutar:</strong> ${fmt(order.total)} ₺<br>
          <strong style="color:#1A1410">Açıklama:</strong> <span style="font-family:monospace">${order.orderNumber}</span>
        </p>
        <p style="margin:10px 0 0;font-size:13px;color:#8a6d3b">Açıklama alanına sipariş numaranızı yazmayı unutmayın — ödemenizi siparişinizle bu numara üzerinden eşleştiriyoruz.</p>
        <p style="margin:8px 0 0;font-size:12px;color:#78716c">Hesap bilgilerimiz değişmez. Farklı bir IBAN'a ödeme isteyen e-posta/mesaj alırsanız dikkate almayın, bizi 0324 433 33 51'den arayın.</p>
      </div>`
      : "";
    const havaleText = isHavale
      ? `

HAVALE/EFT BİLGİLERİ
Alıcı: ${BANKA_HESABI.unvan}
Banka: ${BANKA_HESABI.banka}
IBAN: ${BANKA_HESABI.iban}
Tutar: ${fmt(order.total)} ₺
Açıklama: ${order.orderNumber}

Açıklama alanına sipariş numaranızı yazın — ödeme bu numarayla eşleştirilir.`
      : "";

    // Dosya kalitesi notu (sipariş SONRASI bilgilendirme ayağı — ürün sayfası uyarısı ve
    // sözleşme m.7.C ile aynı kurgu): yalnız tasarım dosyası yüklenmiş siparişlerde eklenir.
    // E-postada yer alması, müşterinin elinde tarihli yazılı bildirim kalmasını sağlar.
    const hasUploadedFile = (order.items ?? []).some((i) => i.uploadedFileName);
    const fileQualityText = hasUploadedFile
      ? "\n\nYüklediğiniz tasarım dosyası hakkında: Yapay zekâ ile üretilmiş, düşük çözünürlüklü veya vektörel olmayan dosyalarda baskıda bulanıklık ve metin bozulmaları oluşabilir; bu tür dosyalardan kaynaklanan kalite sorunlarından markala.com.tr sorumlu değildir. Gerekirse grafik ekibimiz görselinize istinaden vektörel çizimi ücretsiz hazırlayıp onayınıza sunar; üretim, tasarım onayınızdan sonra başlar."
      : "";
    const fileQualityHtml = hasUploadedFile
      ? `<p style="margin:14px 0 0;padding:10px 12px;background:#FDF3E7;border:1px solid #F5D7B2;border-radius:8px;color:#57534e;font-size:13px;line-height:1.5"><strong style="color:#1A1410">Yüklediğiniz tasarım dosyası hakkında:</strong> Yapay zekâ ile üretilmiş, düşük çözünürlüklü veya vektörel olmayan dosyalarda baskıda bulanıklık ve metin bozulmaları oluşabilir; bu tür dosyalardan kaynaklanan kalite sorunlarından markala.com.tr sorumlu değildir. Gerekirse grafik ekibimiz görselinize istinaden <strong style="color:#1A1410">vektörel çizimi ücretsiz hazırlayıp onayınıza sunar</strong>; üretim, tasarım onayınızdan sonra başlar.</p>`
      : "";

    const subject = `Markala - Siparişiniz alındı (${order.orderNumber})`;
    const text =
      `${name ? `Merhaba ${name},` : "Merhaba,"}\n\nSiparişinizi aldık. Sipariş No: ${order.orderNumber}\n\n` +
      (order.items ?? []).map((i) => `  • ${i.productName} × ${i.quantity * birimAdet(i.configurationSummary)} - ${fmt(i.lineTotal)} ₺`).join("\n") +
      `\n\nToplam (KDV dahil): ${fmt(order.total)} ₺\n\n` +
      `${isCari ? "Açık hesap (cari) ile alındı; ay sonu faturalandırılır." : isHavale ? "Havale/EFT ile alındı. Ödemeniz hesabımıza geçtiğinde üretime alınacaktır." : "Ödemeniz alındı, siparişiniz onaylandı."}` +
      havaleText +
      fileQualityText +
      `\n\nSiparişlerim: ${orderUrl}\n\nMarkala, 324 Ajans güvencesiyle.`;

    const html = renderEmail({
      title: "Siparişiniz Alındı 🎉",
      intro: `${greeting} siparişinizi aldık ve hazırlamaya başlıyoruz.`,
      preheader: `Sipariş ${order.orderNumber} alındı, toplam ${fmt(order.total)} ₺`,
      bodyHtml: `<p style="margin:0 0 4px">Sipariş No: <strong>${esc(order.orderNumber)}</strong></p>
        <p style="margin:0 0 14px;color:#78716c;font-size:13px">${statusNote}</p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;font-size:14px">
          <tbody>${rowsHtml}</tbody>
          <tfoot>${totalsHtml}</tfoot>
        </table>
        ${havaleHtml}
        ${adresBlok}
        ${emailButton("Siparişimi görüntüle", orderUrl)}
        ${yasalBlok}
        ${fileQualityHtml}
        <p style="margin:14px 0 0;color:#78716c;font-size:13px">Üretim tamamlanınca kargo bilgisini ayrıca ileteceğiz. Sorularınız için bu e-postayı yanıtlayabilirsiniz.</p>`,
    });

    const alici = aliciOverride ?? order.email;
    try {
      const info = await this.transporter.sendMail({ from: this.from, to: alici, subject: aliciOverride ? `[ÖNİZLEME] ${subject}` : subject, text, html });
      await this.logNotification(alici, "sent", { messageId: info.messageId, template: "order-confirmation", orderNumber: order.orderNumber, onizleme: Boolean(aliciOverride) }, subject);
      return true;
    } catch (err) {
      this.logger.warn(`mail.orderConfirmation failed to=${alici}: ${(err as Error).message}`);
      await this.logNotification(alici, "failed", { error: (err as Error).message, template: "order-confirmation", orderNumber: order.orderNumber, onizleme: Boolean(aliciOverride) }, subject);
      return false;
    }
  }

  /**
   * YENİ SİPARİŞ → YÖNETİCİ bildirimi (2026-08-20, Hasan talebi).
   *
   * Neden eklendi: sipariş geldiğinde yöneticiye HİÇBİR bildirim gitmiyordu. İletişim
   * formu, numune talebi, kurumsal başvuru, KVKK ve hatta bülten aboneliği CONTACT_TO
   * adresine mail atarken, parası ödenmiş sipariş hiç haber vermiyordu — sipariş ancak
   * panele bakınca görülüyordu.
   *
   * "Müşteriyle iletişime geç" butonu wa.me bağlantısıdır: telefondan e-postadaki
   * butona dokununca doğrudan müşterinin WhatsApp sohbeti açılır. Bu yüzden WhatsApp'ın
   * teslimat kanalı olması gerekmiyor — asıl istenen tek-dokunuş erişimi bu şekilde sağlanıyor.
   *
   * Alıcı: ORDER_NOTIFY_TO (virgülle birden fazla) → yoksa ADMIN_EMAIL. İkisi de yoksa no-op.
   */
  /**
   * "Tasarım Onaylandı" → üretim/kargo ekibine bildirim (2026-09-03, Hasan).
   * Müşteriye HİÇBİR ŞEY gitmez; alıcı PRODUCTION_NOTIFY_TO (virgülle birden fazla), yoksa
   * kargo@markala.com.tr. Amaç: atölyedeki kişi panele bakmadan işin üretime alınabileceğini görsün.
   */
  async sendDesignApprovedProductionEmail(orderId: string): Promise<boolean> {
    const raw = (this.config.get<string>("PRODUCTION_NOTIFY_TO") ?? "").trim() || "kargo@markala.com.tr";
    const to = raw.split(",").map((s) => s.trim()).filter(Boolean).join(", ");
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: { select: { fullName: true } } },
    });
    if (!order) {
      this.logger.warn(`mail.designApproved: sipariş yok order=${orderId}`);
      return false;
    }
    const esc = (s: unknown) =>
      String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
    const adminUrl = (this.config.get<string>("ADMIN_URL") ?? "https://admin.markala.com.tr").replace(/\/$/, "");
    const detayUrl = `${adminUrl}/siparisler/${order.id}`;
    const musteri = order.user?.fullName?.trim() || (order.shippingAddressSnapshot as { fullName?: string } | null)?.fullName || "Müşteri";
    const kalemler = (order.items ?? []).map((it) => `${it.quantity} × ${it.productName}`);
    const subject = `✅ Tasarım onaylandı — üretime alınabilir · ${order.orderNumber}`;
    const text =
      `Tasarım onaylandı, üretime alınabilir.\nSipariş: ${order.orderNumber}\nMüşteri: ${musteri}\n` +
      kalemler.map((k) => `- ${k}`).join("\n") + `\n\nPanel: ${detayUrl}`;
    const html = renderEmail({
      title: "Tasarım onaylandı — üretime alınabilir",
      intro: `${esc(order.orderNumber)} · ${esc(musteri)}`,
      preheader: `${order.orderNumber} üretime hazır`,
      bodyHtml:
        `<ul style="margin:0 0 12px;padding-left:18px">${kalemler.map((k) => `<li>${esc(k)}</li>`).join("")}</ul>` +
        `<p style="margin:0 0 8px">Tasarım dosyaları ve önizleme sipariş detayında. İşi üretime aldığınızda durumu "Üretimde" yapın.</p>` +
        emailButton("Siparişi aç", detayUrl) + emailFallbackLink(detayUrl),
    });
    try {
      const info = await this.transporter.sendMail({ from: this.from, to, subject, text, html });
      await this.logNotification(to, "sent", { messageId: info.messageId }, subject);
      return true;
    } catch (err) {
      this.logger.warn(`mail.designApproved failed to=${to}: ${(err as Error).message}`);
      return false;
    }
  }

  async sendNewOrderAdminEmail(orderId: string): Promise<boolean> {
    // 2026-08-21 DÜZELTME: ilk sürüm yalnız ORDER_NOTIFY_TO/ADMIN_EMAIL'e bakıyordu ve
    // bildirim HİÇ gitmedi. Sebep: ADMIN_EMAIL .env.production'da tanımlı ama API
    // KONTEYNERİNE geçmiyor (compose'da api servisine verilmemiş); konteynerde dolu olan
    // değişken CONTACT_TO. Zincire eklendi — CONTACT_TO zaten tüm form bildirimlerinin
    // gittiği yönetici adresi, doğru varsayılan o.
    // `??` KULLANILMIYOR: değişken tanımlı ama BOŞ ise ("ADMIN_EMAIL=") nullish değildir,
    // zincir orada takılıp CONTACT_TO'ya hiç düşmezdi. İlk DOLU değer seçiliyor.
    const raw =
      ["ORDER_NOTIFY_TO", "ADMIN_EMAIL", "CONTACT_TO"]
        .map((k) => (this.config.get<string>(k) ?? "").trim())
        .find((v) => v.length > 0) ?? "";
    const recipients = raw.split(",").map((s) => s.trim()).filter(Boolean);

    // 2026-08-21 (Hasan): grafik tasarımcılar da haberdar olsun — üretim onlarla başlıyor,
    // siparişi panelde görmek için beklemeleri gereksiz gecikme yaratıyordu.
    // Rol veritabanından okunur; panelden tasarımcı eklenince otomatik listeye girer,
    // ayrıca env düzenlemek gerekmez. Rolü kaldırılınca da otomatik çıkar.
    try {
      const designers = await this.prisma.user.findMany({
        where: { role: "tasarimci" },
        select: { email: true },
      });
      for (const d of designers) {
        const mail = (d.email ?? "").trim();
        // Aynı adres iki kez eklenmesin (tasarımcı aynı zamanda bildirim adresiyse).
        if (mail && !recipients.some((r) => r.toLowerCase() === mail.toLowerCase())) {
          recipients.push(mail);
        }
      }
    } catch (e) {
      // Tasarımcı listesi alınamazsa yönetici bildirimi YİNE gitsin — asıl bildirim kaybolmasın.
      this.logger.warn(`mail.newOrderAdmin: tasarımcı listesi alınamadı: ${(e as Error).message}`);
    }
    if (recipients.length === 0) {
      this.logger.warn("mail.newOrderAdmin: ORDER_NOTIFY_TO/ADMIN_EMAIL tanımsız, bildirim atlandı");
      return false;
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: { select: { fullName: true } } },
    });
    if (!order) {
      this.logger.warn(`mail.newOrderAdmin: sipariş yok order=${orderId}`);
      return false;
    }

    const esc = (s: unknown) =>
      String(s ?? "")
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const fmt = (n: unknown) =>
      new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);

    // wa.me uluslararası formatı ister, BAŞINDA + OLMADAN. Siparişlerde telefon
    // "+905301751310" olarak duruyor; yine de 0'la başlayan/boşluklu girdilere karşı normalize edilir.
    const waNumber = (() => {
      const digits = String(order.phone ?? "").replace(/\D/g, "");
      if (!digits) return null;
      if (digits.startsWith("90")) return digits;
      if (digits.startsWith("0")) return "90" + digits.slice(1);
      if (digits.length === 10) return "90" + digits;
      return digits;
    })();

    const adminUrl = (this.config.get<string>("ADMIN_URL") ?? "https://admin.markala.com.tr").replace(/\/$/, "");
    const orderAdminUrl = `${adminUrl}/siparisler`;
    const customerName = order.user?.fullName?.trim() || "Müşteri";
    const waText = encodeURIComponent(
      `Merhaba, ${order.orderNumber} numaralı siparişiniz için Markala'dan yazıyoruz.`,
    );
    const waUrl = waNumber ? `https://wa.me/${waNumber}?text=${waText}` : null;

    const isCari = order.paymentMethod === "cari";
    const paid = order.paymentStatus === "basarili";
    const payLabel = isCari ? "Açık hesap (cari)" : paid ? "Ödendi" : "ÖDEME BEKLİYOR";

    const rowsHtml = (order.items ?? [])
      .map(
        (it) =>
          `<tr><td style="padding:4px 8px">${esc(it.productName)}</td>` +
          `<td style="padding:4px 8px;text-align:center">${esc(it.quantity)}</td>` +
          `<td style="padding:4px 8px;text-align:right">${fmt(it.lineTotal)} ₺</td></tr>`,
      )
      .join("");

    const subject = `🔔 Yeni sipariş - ${order.orderNumber} · ${fmt(order.total)} ₺${paid || isCari ? "" : " (ödeme bekliyor)"}`;
    const text =
      `Yeni sipariş: ${order.orderNumber}\nTutar: ${fmt(order.total)} ₺ (KDV dahil)\nÖdeme: ${payLabel}\n\n` +
      `Müşteri: ${customerName}\nTelefon: ${order.phone ?? "-"}\nE-posta: ${order.email ?? "-"}\n` +
      (waUrl ? `WhatsApp: ${waUrl}\n` : "") +
      `\nPanel: ${orderAdminUrl}`;

    const html = renderEmail({
      title: "Yeni sipariş",
      bodyHtml:
        `<p style="margin:0 0 10px"><strong style="font-size:18px">${esc(order.orderNumber)}</strong> · ` +
        `<strong style="font-size:18px">${fmt(order.total)} ₺</strong> <span style="color:#78716c">(KDV dahil)</span></p>` +
        `<p style="margin:0 0 14px;color:${paid || isCari ? "#16a34a" : "#dc2626"};font-weight:600">Ödeme: ${esc(payLabel)}</p>` +
        `<table role="presentation" style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 14px">` +
        `<tr><td style="padding:3px 0;color:#78716c;width:90px">Müşteri</td><td style="padding:3px 0"><strong>${esc(customerName)}</strong></td></tr>` +
        `<tr><td style="padding:3px 0;color:#78716c">Telefon</td><td style="padding:3px 0">${esc(order.phone ?? "-")}</td></tr>` +
        `<tr><td style="padding:3px 0;color:#78716c">E-posta</td><td style="padding:3px 0">${esc(order.email ?? "-")}</td></tr>` +
        `</table>` +
        `<table role="presentation" style="width:100%;border-collapse:collapse;font-size:13px;margin:0 0 16px">` +
        `<thead><tr style="background:#F5F3F0"><th style="padding:6px 8px;text-align:left">Ürün</th>` +
        `<th style="padding:6px 8px;text-align:center">Adet</th><th style="padding:6px 8px;text-align:right">Tutar</th></tr></thead>` +
        `<tbody>${rowsHtml}</tbody></table>` +
        (waUrl ? emailButtonColored("💬 Müşteriyle WhatsApp'tan iletişime geç", waUrl, "#25D366") : "") +
        emailButton("Siparişi panelde aç", orderAdminUrl) +
        (waUrl ? emailFallbackLink(waUrl) : ""),
    });

    let ok = false;
    for (const to of recipients) {
      try {
        const info = await this.transporter.sendMail({ from: this.from, to, subject, text, html });
        await this.logNotification(to, "sent", { messageId: info.messageId, template: "new-order-admin", orderNumber: order.orderNumber }, subject);
        ok = true;
      } catch (err) {
        this.logger.warn(`mail.newOrderAdmin failed to=${to}: ${(err as Error).message}`);
        await this.logNotification(to, "failed", { error: (err as Error).message, template: "new-order-admin", orderNumber: order.orderNumber }, subject);
      }
    }
    return ok;
  }

  /**
   * "Baskıya verildi" bildirimi — müşteriye (2026-08-20, Hasan talebi).
   *
   * Neden: 7 sipariş durumundan yalnız 3'ü (kargoya-verildi, teslim-edildi, iptal-edildi)
   * mail tetikliyordu. Sipariş onayı ile kargo arasındaki üretim süreci tamamen sessizdi;
   * matbaada bu günler sürüyor ve "siparişim ne oldu" aramalarının ana kaynağı burası.
   *
   * KAPSAM KARARI (Hasan): müşteriyi boğmamak için her durum değişikliğinde mail YOK.
   * Bildirim gönderilen dört an: sipariş alındı · baskıya verildi (bu metot) ·
   * kargoya verildi · teslim edildi. "tasarim-bekleniyor" ve "tasarim-onayindi"
   * BİLEREK sessiz bırakıldı.
   */
  async sendOrderInProductionEmail(orderId: string): Promise<boolean> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { fullName: true } } },
    });
    if (!order || !order.email) {
      this.logger.warn(`mail.orderInProduction: sipariş/e-posta yok order=${orderId}`);
      return false;
    }
    const esc = (s: unknown) =>
      String(s ?? "")
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const name = (order.user?.fullName?.trim() || (order.shippingAddressSnapshot as { fullName?: string } | null)?.fullName?.trim()) ?? undefined;
    const greeting = name ? `Merhaba ${esc(name)},` : "Merhaba,";
    const webUrl = (this.config.get<string>("WEB_URL") ?? "https://markala.com.tr").replace(/\/$/, "");
    const orderUrl = `${webUrl}/hesabim/siparislerim`;

    const subject = `Siparişin baskıya verildi 🖨️ ${order.orderNumber}`;
    const text =
      `${name ? `Merhaba ${name},` : "Merhaba,"}

${order.orderNumber} numaralı siparişin baskıya verildi.
` +
      `Üretim tamamlanınca kargo bilgisini ayrıca ileteceğiz.

Siparişlerim: ${orderUrl}

Markala`;
    const html = renderEmail({
      title: "Siparişin Baskıda 🖨️",
      intro: `${greeting} siparişin baskıya verildi.`,
      preheader: `${order.orderNumber}, üretim başladı, sırada kargo var`,
      bodyHtml:
        `<p style="margin:0 0 8px">Sipariş No: <strong>${esc(order.orderNumber)}</strong></p>` +
        `<p style="margin:0 0 12px">Üretim tamamlanınca kargoya veriyoruz ve takip numarasını ayrıca ileteceğiz.</p>` +
        `<p style="margin:0 0 14px;color:#78716c;font-size:13px">Bu aşamada tasarım değişikliği yapılamıyor; bir sorun varsa lütfen hemen bize ulaş.</p>` +
        emailButton("Siparişimi görüntüle", orderUrl),
    });

    try {
      const info = await this.transporter.sendMail({ from: this.from, to: order.email, subject, text, html });
      await this.logNotification(order.email, "sent", { messageId: info.messageId, template: "order-in-production", orderNumber: order.orderNumber }, subject);
      return true;
    } catch (err) {
      this.logger.warn(`mail.orderInProduction failed to=${order.email}: ${(err as Error).message}`);
      await this.logNotification(order.email, "failed", { error: (err as Error).message, template: "order-in-production", orderNumber: order.orderNumber }, subject);
      return false;
    }
  }

  /** Sipariş kargoya verildiğinde müşteriye bildirim (updateStatus "kargoya-verildi" tetikler). */
  /** aliciOverride: yalnız admin mail-önizleme testinde dolu — müşteriye DEĞİL, verilen adrese gider. */
  async sendOrderShippedEmail(orderId: string, tracking?: { number?: string; carrier?: string }, aliciOverride?: string): Promise<boolean> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: { select: { fullName: true } } },
    });
    if (!order || !order.email) { this.logger.warn(`mail.orderShipped: sipariş/e-posta yok order=${orderId}`); return false; }
    const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const name = (order.user?.fullName?.trim() || (order.shippingAddressSnapshot as { fullName?: string } | null)?.fullName?.trim()) ?? undefined;
    const greeting = name ? `Merhaba ${esc(name)},` : "Merhaba,";
    const webUrl = (this.config.get<string>("WEB_URL") ?? "https://markala.com.tr").replace(/\/$/, "");
    const orderUrl = `${webUrl}/hesabim/siparislerim`;
    const carrier = (tracking?.carrier ?? order.trackingCarrier ?? "").trim();
    const trackNo = (tracking?.number ?? order.trackingNumber ?? "").trim();

    // Firma → takip sayfası eşlemesi (numara otomatik dolu gider; eşleşmeyen firmada
    // sitedeki kargo-takip sayfasına düşer). Kargo anlaşması değişirse buraya ekle.
    const takipUrl = (() => {
      const k = carrier.toLowerCase();
      if (!trackNo) return `${webUrl}/kargo-takip`;
      if (k.includes("dhl")) return `https://www.dhl.com/tr-tr/home/tracking.html?tracking-id=${encodeURIComponent(trackNo)}`;
      if (k.includes("yurtiçi") || k.includes("yurtici")) return `https://www.yurticikargo.com/tr/online-servisler/gonderi-sorgula?code=${encodeURIComponent(trackNo)}`;
      if (k.includes("aras")) return `https://kargotakip.araskargo.com.tr/mainpage.aspx?code=${encodeURIComponent(trackNo)}`;
      if (k.includes("mng")) return `https://kargotakip.mngkargo.com.tr/?takipNo=${encodeURIComponent(trackNo)}`;
      if (k.includes("ptt")) return `https://gonderitakip.ptt.gov.tr/Track/Verify?q=${encodeURIComponent(trackNo)}`;
      if (k.includes("sürat") || k.includes("surat")) return `https://www.suratkargo.com.tr/KargoTakip?kargotakipno=${encodeURIComponent(trackNo)}`;
      return `${webUrl}/kargo-takip`;
    })();

    // KOŞULLU DAVRANIŞ (2026-08-29, Hasan kararı): takip no GİRİLDİYSE vurgulu kargo kartı
    // (firma + büyük numara + firmaya giden takip düğmesi); GİRİLMEDİYSE dürüst bilgi cümlesi.
    const kargoKarti = trackNo
      ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate">
          <tr><td bgcolor="#FDF8E7" style="background:#FDF8E7;border:1px solid #F5D77F;border-radius:10px;padding:16px 18px">
            <table role="presentation" cellpadding="0" cellspacing="0" width="100%"><tr>
              <td style="vertical-align:middle">
                ${carrier ? `<p style="margin:0;font-size:11px;color:#8a6d00;font-weight:700;letter-spacing:0.5px">KARGO FİRMASI</p><p style="margin:2px 0 10px;font-size:16px;color:#1A1410;font-weight:700">🚚 ${esc(carrier)}</p>` : ""}
                <p style="margin:0;font-size:11px;color:#8a6d00;font-weight:700;letter-spacing:0.5px">TAKİP NUMARASI</p>
                <p style="margin:2px 0 0;font-size:18px;color:#1A1410;font-weight:700;font-family:'Courier New',monospace;letter-spacing:1px">${esc(trackNo)}</p>
              </td>
              <td style="vertical-align:middle;text-align:right;white-space:nowrap">
                <table role="presentation" cellpadding="0" cellspacing="0" align="right"><tr><td bgcolor="#1A1410" style="background:#1A1410;border-radius:8px">
                  <a href="${takipUrl}" style="display:inline-block;padding:12px 20px;font-family:Arial,Helvetica,sans-serif;font-size:13px;font-weight:700;color:#F5B800;text-decoration:none">Kargoyu Takip Et →</a>
                </td></tr></table>
              </td>
            </tr></table>
          </td></tr>
        </table>`
      : `<p style="margin:0 0 4px;padding:12px 14px;background:#FAFAF9;border:1px solid #e7e5e4;border-radius:8px;color:#57534e;font-size:13px;line-height:1.5">📦 Kargo takip numaranız, ilgili kargo firması tarafından SMS/e-posta ile ayrıca iletilecektir.</p>`;

    // Gönderilen ürünler (küçük görselli) + teslimat adresi kartı
    const urunSatirlari = (order.items ?? [])
      .map(
        (i) =>
          `<tr><td style="padding:10px 8px;border-bottom:1px solid #eee;width:64px;vertical-align:top">` +
          (i.productImage ? `<img src="${esc(i.productImage)}" width="56" height="56" alt="${esc(i.productName)}" style="display:block;width:56px;height:56px;border-radius:8px;border:1px solid #e7e5e4">` : "") +
          `</td><td style="padding:10px 8px;border-bottom:1px solid #eee;vertical-align:top"><strong>${esc(i.productName)}</strong>` +
          `${i.configurationSummary ? `<br><span style="color:#a8a29e;font-size:12px">${esc(i.configurationSummary)}</span>` : ""}` +
          `<br><span style="color:#78716c;font-size:12px">Adet: ${i.quantity * birimAdet(i.configurationSummary)}</span></td></tr>`,
      )
      .join("");
    type AdresSnap = { fullName?: string; fullAddress?: string; district?: string; city?: string } | null;
    const adres = order.shippingAddressSnapshot as AdresSnap;
    const adresBlok = adres && (adres.fullAddress || adres.fullName)
      ? `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:separate;margin-top:12px">
          <tr><td style="background:#FAFAF9;border:1px solid #e7e5e4;border-radius:8px;padding:12px 14px">
            <p style="margin:0 0 4px;font-size:11px;color:#a8a29e;font-weight:700;letter-spacing:0.5px">TESLİMAT ADRESİ</p>
            <p style="margin:0;font-size:13px;color:#1A1410;line-height:1.5">${esc(adres.fullName ?? "")}${adres.fullName ? "-" : ""}${esc(adres.fullAddress ?? "")}${(adres.district || adres.city) && !(adres.fullAddress ?? "").includes(adres.city ?? " ") ? `, ${esc(adres.district ?? "")}${adres.district && adres.city ? " / " : ""}${esc(adres.city ?? "")}` : ""}</p>
            <p style="margin:6px 0 0;font-size:12px;color:#78716c">Tahmini teslim: <strong style="color:#1A1410">1-3 iş günü</strong></p>
          </td></tr>
        </table>`
      : `<p style="margin:12px 0 0;color:#78716c;font-size:13px">Tahmini teslim: <strong>1-3 iş günü</strong>.</p>`;

    const subject = `Siparişin kargoda! 📦 ${order.orderNumber}`;
    const text =
      `${name ? `Merhaba ${name},` : "Merhaba,"}\n\n${order.orderNumber} numaralı siparişin kargoya verildi.\n` +
      (trackNo
        ? `${carrier ? `Kargo: ${carrier}\n` : ""}Takip no: ${trackNo}\nTakip: ${takipUrl}\n`
        : `Kargo takip numaranız, kargo firması tarafından SMS/e-posta ile ayrıca iletilecektir.\n`) +
      `Tahmini teslim: 1-3 iş günü.\n\nSiparişlerim: ${orderUrl}\n\nMarkala`;
    const html = renderEmail({
      title: "Siparişin Kargoda 📦",
      intro: `${greeting} paketin yola çıktı!`,
      preheader: `${order.orderNumber} kargoya verildi, tahmini teslim 1-3 iş günü`,
      bodyHtml: `${kargoKarti}
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;font-size:14px;margin-top:14px">
          <tr><td colspan="2" style="padding:0 0 6px;font-size:12px;color:#78716c">Sipariş No: <strong style="color:#1A1410">${esc(order.orderNumber)}</strong></td></tr>
          ${urunSatirlari}
        </table>
        ${adresBlok}
        <p style="margin:14px 0 0;padding:10px 12px;background:#F0F9F1;border:1px solid #BBE5C0;border-radius:8px;color:#57534e;font-size:12px;line-height:1.5">💡 <strong style="color:#1A1410">Teslim alırken:</strong> Pakette gözle görülür hasar varsa kuryeye "hasarlı teslim alındı" tutanağı tutturmanızı öneririz, olası değişim/iade sürecini hızlandırır.</p>
        ${emailButton("Siparişlerim", orderUrl)}
        <p style="margin:12px 0 0;color:#78716c;font-size:13px">Bir sorun olursa bu e-postayı yanıtlayabilir ya da WhatsApp'tan yazabilirsin.</p>`,
    });
    const alici = aliciOverride ?? order.email;
    try {
      const info = await this.transporter.sendMail({ from: this.from, to: alici, subject: aliciOverride ? `[ÖNİZLEME] ${subject}` : subject, text, html });
      await this.logNotification(alici, "sent", { messageId: info.messageId, template: "order-shipped", orderNumber: order.orderNumber, onizleme: Boolean(aliciOverride) }, subject);
      return true;
    } catch (err) {
      this.logger.warn(`mail.orderShipped failed to=${alici}: ${(err as Error).message}`);
      await this.logNotification(alici, "failed", { error: (err as Error).message, template: "order-shipped", orderNumber: order.orderNumber, onizleme: Boolean(aliciOverride) }, subject);
      return false;
    }
  }

  /** Sipariş iptal edildiğinde müşteri bilgilendirmesi (updateStatus "iptal-edildi" tetikler).
   *  Ödemesi başarılı siparişte iade beklentisi doğar → iade sürecine dair net cümle şart. */
  async sendOrderCancelledEmail(orderId: string): Promise<boolean> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { fullName: true } } },
    });
    if (!order || !order.email) { this.logger.warn(`mail.orderCancelled: sipariş/e-posta yok order=${orderId}`); return false; }
    const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const name = (order.user?.fullName?.trim() || (order.shippingAddressSnapshot as { fullName?: string } | null)?.fullName?.trim()) ?? undefined;
    const greeting = name ? `Merhaba ${esc(name)},` : "Merhaba,";
    const webUrl = (this.config.get<string>("WEB_URL") ?? "https://markala.com.tr").replace(/\/$/, "");
    const paid = order.paymentStatus === "basarili";
    const refundLineText = paid
      ? "Ödemen 3-7 iş günü içinde kartına iade edilir; gecikirse bu e-postayı yanıtlaman yeterli."
      : "Bu sipariş için tahsil edilmiş bir ödeme yok.";
    const subject = `Siparişin iptal edildi - ${order.orderNumber}`;
    const text = `${name ? `Merhaba ${name},` : "Merhaba,"}\n\n${order.orderNumber} numaralı siparişin iptal edildi.\n${refundLineText}\n\nYanlışlıkla iptal olduğunu düşünüyorsan ya da sorun yaşadıysan bize yaz: 0324 433 33 51 (WhatsApp: 0531 900 41 02).\n\nMarkala`;
    const html = renderEmail({
      title: "Siparişin İptal Edildi",
      intro: `${greeting} ${esc(order.orderNumber)} numaralı siparişin iptal edildi.`,
      preheader: `${order.orderNumber} iptal edildi${paid ? ", ödemen iade edilecek" : ""}`,
      bodyHtml: `<p style="margin:0 0 14px">${esc(refundLineText)}</p>
        ${emailButton("Yeniden sipariş ver", `${webUrl}/urunler`)}
        <p style="margin:14px 0 0;color:#78716c;font-size:13px">Yanlışlıkla iptal olduğunu düşünüyorsan bu e-postayı yanıtla ya da WhatsApp'tan yaz, hemen bakalım.</p>`,
    });
    try {
      const info = await this.transporter.sendMail({ from: this.from, to: order.email, subject, text, html });
      await this.logNotification(order.email, "sent", { messageId: info.messageId, template: "order-cancelled", orderNumber: order.orderNumber }, subject);
      return true;
    } catch (err) {
      this.logger.warn(`mail.orderCancelled failed to=${order.email}: ${(err as Error).message}`);
      await this.logNotification(order.email, "failed", { error: (err as Error).message, template: "order-cancelled", orderNumber: order.orderNumber }, subject);
      return false;
    }
  }

  /**
   * Sipariş teslim edildiğinde teşekkür + WhatsApp üzerinden değerlendirme daveti
   * (updateStatus "teslim-edildi" tetikler). Değerlendirme daveti WhatsApp'a taşındı:
   * müşteri tek tıkla ön-doldurulmuş mesajla yazar (dönüşüm > web form). HATA FIRLATMAZ.
   */
  async sendOrderDeliveredEmail(orderId: string): Promise<boolean> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { user: { select: { fullName: true } } },
    });
    if (!order || !order.email) { this.logger.warn(`mail.orderDelivered: sipariş/e-posta yok order=${orderId}`); return false; }
    const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const name = (order.user?.fullName?.trim() || (order.shippingAddressSnapshot as { fullName?: string } | null)?.fullName?.trim()) ?? undefined;
    const greeting = name ? `Merhaba ${esc(name)},` : "Merhaba,";
    const webUrl = (this.config.get<string>("WEB_URL") ?? "https://markala.com.tr").replace(/\/$/, "");
    // Tekrar sipariş: sipariş detayında "Tekrar Sipariş Et" butonu var → aynı konfigürasyonla
    // sepete ekler. Teslim anı, tekrar alım niyetinin en yüksek olduğu an (retention dokunuşu).
    const reorderUrl = `${webUrl}/hesabim/siparislerim/${order.id}`;

    // Değerlendirme daveti WhatsApp üzerinden. Numara env ile configurable; fallback = markala
    // mobil hattı (apps/web/src/lib/whatsapp.ts MARKALA_WHATSAPP_NUMBER ile aynı — 0324 sabit
    // hat WhatsApp'a kayıtlı DEĞİL). Ön-doldurulmuş mesaj müşteri-kaynaklı değer içermediğinden
    // (yalnız orderNumber) güvenli; encodeURIComponent Türkçe + boşlukları güvenle kodlar.
    const waNumber = (this.config.get<string>("WHATSAPP_NUMBER") ?? "905319004102").replace(/\D/g, "");
    const waMessage = `Sipariş ${order.orderNumber} için değerlendirmemi paylaşıyorum: `;
    const waUrl = `https://wa.me/${waNumber}?text=${encodeURIComponent(waMessage)}`;

    const subject = "Siparişiniz teslim edildi - Değerlendirmenizi paylaşır mısınız?";
    const text = `${name ? `Merhaba ${name},` : "Merhaba,"}\n\n${order.orderNumber} numaralı siparişiniz teslim edildi. Umarız beğenirsiniz!\nBaskı kalitesinden memnunsanız, değerlendirmenizi WhatsApp üzerinden bizimle paylaşır mısınız:\n${waUrl}\nAynı ürünlere yeniden ihtiyacınız olursa tek tıkla tekrar sipariş verebilirsiniz: ${reorderUrl}\nBir sorun varsa hemen bize yazın.\n\nMarkala`;
    const html = renderEmail({
      title: "Siparişiniz Teslim Edildi ✅",
      intro: `${greeting} ${esc(order.orderNumber)} numaralı siparişiniz teslim edildi, umarız beğenirsiniz!`,
      preheader: `${order.orderNumber} teslim edildi, değerlendirmeniz bizim için değerli`,
      bodyHtml: `<p style="margin:0 0 14px">Baskı kalitesinden memnun kaldıysanız, değerlendirmenizi <strong>WhatsApp</strong> üzerinden bizimle paylaşır mısınız? Görüşünüz hem bize hem yeni müşterilere yol gösterir.</p>
        ${emailButtonColored("💬 WhatsApp'tan değerlendir", waUrl)}
        ${emailFallbackLink(waUrl)}
        <p style="margin:14px 0 0;font-size:13px;color:#78716c">Aynı ürünlere yeniden mi ihtiyacınız var? <a href="${reorderUrl}" style="color:#5C4100;font-weight:700">Tekrar sipariş ver →</a></p>
        <p style="margin:10px 0 0;color:#78716c;font-size:13px">Bir sorun varsa hemen bize yazın.</p>`,
    });

    // Nodemailer yalnız SMTP_HOST varsa gerçek gönderim yapar. Yoksa localhost:1025'e düşüp
    // 10sn timeout + "failed" log üretmesin: gönderim atlanır, "skipped" kaydı bırakılır —
    // gerçek gönderim için SMTP_HOST env beklenir (spec c: "yoksa kaydet + log at").
    if (!this.config.get<string>("SMTP_HOST")) {
      this.logger.log(`mail.orderDelivered: SMTP_HOST yok → gönderim atlandı, log bırakıldı order=${order.orderNumber} to=${order.email}`);
      await this.logNotification(order.email, "skipped", { template: "order-delivered", orderNumber: order.orderNumber, reason: "smtp-not-configured" }, subject);
      return false;
    }

    try {
      const info = await this.transporter.sendMail({ from: this.from, to: order.email, subject, text, html });
      await this.logNotification(order.email, "sent", { messageId: info.messageId, template: "order-delivered", orderNumber: order.orderNumber }, subject);
      return true;
    } catch (err) {
      this.logger.warn(`mail.orderDelivered failed to=${order.email}: ${(err as Error).message}`);
      await this.logNotification(order.email, "failed", { error: (err as Error).message, template: "order-delivered", orderNumber: order.orderNumber }, subject);
      return false;
    }
  }

  /**
   * Bekleyen-ödeme kurtarma maili — İŞLEMSEL ileti (başlatılmış sipariş hakkında bilgilendirme;
   * kupon/pazarlama içeriği YOK). LifecycleService saatlik cron'u tetikler.
   * stage 1 = ilk hatırlatma (2-24 saat), stage 2 = son hatırlatma (24-72 saat).
   * Sipariş job'da kalemleriyle zaten yüklü olduğundan tekrar sorgu yerine nesne alınır.
   * HATA FIRLATMAZ — cron döngüsünü bloke etmez.
   */
  async sendPaymentRecoveryEmail(
    order: {
      id: string;
      orderNumber: string;
      email: string;
      total: unknown;
      items: Array<{ productName: string; quantity: number; lineTotal: unknown }>;
      user?: { fullName: string | null } | null;
      /** Havalede hesap bilgisi maile eklenir; lifecycle findMany tüm skaler alanları getirir. */
      paymentMethod?: string | null;
    },
    stage: 1 | 2,
  ): Promise<boolean> {
    if (!order.email) {
      this.logger.warn(`mail.paymentRecovery: e-posta yok order=${order.id}`);
      return false;
    }
    const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const fmt = (n: unknown) =>
      new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(n) || 0);
    // Bu fonksiyonun order tipi dar (snapshot alanı yok) — yalnız üyelik adı kullanılır.
    const name = order.user?.fullName?.trim() ?? undefined;
    const greeting = name ? `Merhaba ${esc(name)},` : "Merhaba,";
    const webUrl = (this.config.get<string>("WEB_URL") ?? "https://markala.com.tr").replace(/\/$/, "");
    // Sipariş detayında "Ödeme Yap" akışı zaten var → müşteriyi doğrudan oraya götür.
    const payUrl = `${webUrl}/hesabim/siparislerim/${order.id}`;
    const template = `payment-recovery-${stage}`;

    /**
     * Havale hatırlatmasında HESAP BİLGİSİ tekrar verilir.
     * Neden: müşteri ilk maildeki IBAN'ı kaybetmiş olabilir ve "Ödemeyi Tamamla"
     * butonu /hesabim/... adresine gider — MİSAFİR havale siparişinde orası giriş
     * ister, çıkmaz sokaktır. IBAN'ı doğrudan koymak tek işleyen yol.
     *
     * Dolandırıcılık notu bilinçli: "IBAN değişti" konulu sahte e-postalar
     * Türkiye'de yaygın bir saldırı; hesabın değişmediğini burada söylemek
     * müşteriyi o senaryoya karşı uyarır.
     */
    const isHavale = order.paymentMethod === ODEME_YONTEMI.havale;
    const havaleHtml = isHavale
      ? `<div style="margin:16px 0 0;padding:14px;background:#F7F5F0;border:1px solid #E7E2D8;border-radius:10px">
        <p style="margin:0 0 10px;font-weight:600;color:#1A1410">Havale/EFT bilgileri</p>
        <p style="margin:0;font-size:14px;color:#44403c;line-height:1.9">
          <strong style="color:#1A1410">Alıcı:</strong> ${esc(BANKA_HESABI.unvan)}<br>
          <strong style="color:#1A1410">Banka:</strong> ${esc(BANKA_HESABI.banka)}<br>
          <strong style="color:#1A1410">IBAN:</strong> <span style="font-family:monospace;font-size:15px">${esc(BANKA_HESABI.iban)}</span><br>
          <strong style="color:#1A1410">Tutar:</strong> ${fmt(order.total)} ₺<br>
          <strong style="color:#1A1410">Açıklama:</strong> <span style="font-family:monospace">${esc(order.orderNumber)}</span>
        </p>
        <p style="margin:10px 0 0;font-size:13px;color:#8a6d3b">Açıklama alanına sipariş numaranızı yazmayı unutmayın — ödemenizi siparişinizle bu numara üzerinden eşleştiriyoruz.</p>
        <p style="margin:8px 0 0;font-size:12px;color:#78716c">Hesap bilgilerimiz değişmez. Farklı bir IBAN'a ödeme isteyen e-posta/mesaj alırsanız dikkate almayın, bizi 0324 433 33 51'den arayın.</p>
      </div>`
      : "";

    // 2. mailde YANLIŞ VAAT YOK: iptal otomasyonu olmadığı için "yarın iptal edilir" denmez,
    // "stok/fiyat değişebilir" gibi baskı cümlesi de kurulmaz — nötr son hatırlatma.
    const subject =
      stage === 1
        ? `Siparişin seni bekliyor, ödemeni tamamla (${order.orderNumber})`
        : `Son hatırlatma: ${order.orderNumber} siparişinin ödemesi açık`;
    const introLine =
      stage === 1
        ? "siparişini aldık ama ödemesi henüz tamamlanmadı. Ödemeni tamamla, üretime alalım."
        : "siparişinin ödemesi hâlâ açık görünüyor. Bu, konuyla ilgili son hatırlatmamız.";

    const rowsHtml = (order.items ?? [])
      .map(
        (i) =>
          `<tr><td style="padding:8px;border-bottom:1px solid #eee">${esc(i.productName)}</td>` +
          `<td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td>` +
          `<td style="padding:8px;border-bottom:1px solid #eee;text-align:right">${fmt(i.lineTotal)} ₺</td></tr>`,
      )
      .join("");

    const text =
      `${name ? `Merhaba ${name},` : "Merhaba,"}\n\n` +
      `${order.orderNumber} numaralı siparişinin ödemesi henüz tamamlanmadı.\n\n` +
      (order.items ?? []).map((i) => `  • ${i.productName} × ${i.quantity} - ${fmt(i.lineTotal)} ₺`).join("\n") +
      `\n\nToplam (KDV dahil): ${fmt(order.total)} ₺\n\n` +
      (isHavale
        ? `HAVALE/EFT BİLGİLERİ
Alıcı: ${BANKA_HESABI.unvan}
Banka: ${BANKA_HESABI.banka}
IBAN: ${BANKA_HESABI.iban}
Tutar: ${fmt(order.total)} ₺
Açıklama: ${order.orderNumber}

Açıklama alanına sipariş numaranızı yazın — ödeme bu numarayla eşleştirilir.
Hesap bilgilerimiz değişmez; farklı bir IBAN isteyen mesajlara itibar etmeyin (0324 433 33 51).

`
        : `Ödemeyi tamamla: ${payUrl}

`) +
      `Sorun yaşıyorsan bu e-postayı yanıtlayabilirsin.\n\nMarkala, 324 Ajans BT tarafından gönderilmiştir (işlemsel ileti).`;

    const html = renderEmail({
      title: stage === 1 ? "Siparişin Seni Bekliyor" : "Son Hatırlatma",
      intro: `${greeting} ${introLine}`,
      preheader: `${order.orderNumber}, ödeme bekleniyor, toplam ${fmt(order.total)} ₺`,
      bodyHtml: `<p style="margin:0 0 4px">Sipariş No: <strong>${esc(order.orderNumber)}</strong></p>
        <p style="margin:0 0 14px;color:#78716c;font-size:13px">Ödemen tamamlanınca siparişini hemen üretime alıyoruz.</p>
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;font-size:14px">
          <thead><tr>
            <th style="padding:8px;text-align:left;border-bottom:2px solid #1A1410;color:#1A1410">Ürün</th>
            <th style="padding:8px;text-align:center;border-bottom:2px solid #1A1410;color:#1A1410">Adet</th>
            <th style="padding:8px;text-align:right;border-bottom:2px solid #1A1410;color:#1A1410">Tutar</th>
          </tr></thead>
          <tbody>${rowsHtml}</tbody>
          <tfoot><tr>
            <td colspan="2" style="padding:8px;text-align:right;font-weight:700;border-top:2px solid #1A1410">Toplam (KDV dahil)</td>
            <td style="padding:8px;text-align:right;font-weight:700;border-top:2px solid #1A1410">${fmt(order.total)} ₺</td>
          </tr></tfoot>
        </table>
        ${isHavale ? havaleHtml : emailButton("Ödemeyi Tamamla", payUrl) + emailFallbackLink(payUrl)}
        <p style="margin:14px 0 0;color:#78716c;font-size:13px">Bir sorunla karşılaştıysan ya da vazgeçtiysen bu e-postayı yanıtlaman yeterli, yardımcı olalım.</p>`,
    });

    try {
      const info = await this.transporter.sendMail({ from: this.from, to: order.email, subject, text, html });
      await this.logNotification(order.email, "sent", { messageId: info.messageId, template, orderNumber: order.orderNumber }, subject);
      return true;
    } catch (err) {
      this.logger.warn(`mail.paymentRecovery(${stage}) failed to=${order.email}: ${(err as Error).message}`);
      await this.logNotification(order.email, "failed", { error: (err as Error).message, template, orderNumber: order.orderNumber }, subject);
      return false;
    }
  }

  /**
   * Sepet terk hatırlatması — misafir (cart_leads'ten yakalanmış e-posta) veya üye
   * (sepete eklemiş ama sipariş oluşturmamış) için. n8n'in günlük kontrolü tetikler
   * (bkz. internal-notify.controller.ts). Hata fırlatmaz.
   */
  async sendCartReminderEmail(
    to: string,
    items: Array<{ productName: string; quantity: number }>,
    opts: { name?: string | null; kind: "guest" | "member" },
  ): Promise<boolean> {
    if (!to) return false;
    const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const name = opts.name?.trim();
    const greeting = name ? `Merhaba ${esc(name)},` : "Merhaba,";
    const webUrl = (this.config.get<string>("WEB_URL") ?? "https://markala.com.tr").replace(/\/$/, "");
    const cartUrl = `${webUrl}/sepet`;
    const template = opts.kind === "guest" ? "cart-reminder-guest" : "cart-reminder-member";
    const subject = "Sepetinde ürünler seni bekliyor";
    const safeItems = items ?? [];

    const rowsHtml = safeItems
      .map(
        (i) =>
          `<tr><td style="padding:8px;border-bottom:1px solid #eee">${esc(i.productName)}</td>` +
          `<td style="padding:8px;border-bottom:1px solid #eee;text-align:center">${i.quantity}</td></tr>`,
      )
      .join("");

    const text =
      `${greeting}\n\nSepetine eklediğin şu ürünler hâlâ seni bekliyor:\n\n` +
      safeItems.map((i) => `  • ${i.productName} × ${i.quantity}`).join("\n") +
      `\n\nSepetine dön: ${cartUrl}\n\nMarkala, 324 Ajans BT tarafından gönderilmiştir.`;

    const html = renderEmail({
      title: "Sepetin Seni Bekliyor",
      intro: `${greeting} sepetine eklediğin ürünler hâlâ orada duruyor.`,
      preheader: `Sepetinde ${safeItems.length} ürün seni bekliyor`,
      bodyHtml: `<table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="border-collapse:collapse;font-size:14px">
          <thead><tr>
            <th style="padding:8px;text-align:left;border-bottom:2px solid #1A1410;color:#1A1410">Ürün</th>
            <th style="padding:8px;text-align:center;border-bottom:2px solid #1A1410;color:#1A1410">Adet</th>
          </tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
        ${emailButton("Sepetime Dön", cartUrl)}
        ${emailFallbackLink(cartUrl)}`,
    });

    try {
      const info = await this.transporter.sendMail({ from: this.from, to, subject, text, html });
      await this.logNotification(to, "sent", { messageId: info.messageId, template }, subject);
      return true;
    } catch (err) {
      this.logger.warn(`mail.cartReminder(${opts.kind}) failed to=${to}: ${(err as Error).message}`);
      await this.logNotification(to, "failed", { error: (err as Error).message, template }, subject);
      return false;
    }
  }

  /** Yeni kayıt sonrası hoş geldin + ilk sipariş kuponu (register tetikler). */
  async sendWelcomeEmail(to: string, name?: string | null): Promise<boolean> {
    if (!to) return false;
    const esc = (s: unknown) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const gname = name?.trim();
    const greeting = gname ? `Merhaba ${esc(gname)},` : "Merhaba,";
    const webUrl = (this.config.get<string>("WEB_URL") ?? "https://markala.com.tr").replace(/\/$/, "");
    const shopUrl = `${webUrl}/urunler`;
    const subject = `Markala'ya hoş geldin! 🎉 İlk siparişine %10`;
    const text = `${gname ? `Merhaba ${gname},` : "Merhaba,"}\n\nMarkala'ya hoş geldin! Kartvizitten brandaya 30+ matbaa & reklam ürünü seni bekliyor.\nİlk siparişine özel: HOSGELDIN kodu ile %10 indirim.\n\nAlışverişe başla: ${shopUrl}\n\nÜcretsiz tasarım desteği · 1-2 iş günü üretim · 81 ile kargo.\nMarkala`;
    const html = renderEmail({
      title: "Markala'ya Hoş Geldin! 🎉",
      intro: `${greeting} aramıza hoş geldin! Kartvizitten brandaya 30+ matbaa &amp; reklam ürünü seni bekliyor.`,
      preheader: `Hoş geldin! İlk siparişine HOSGELDIN koduyla %10 indirim`,
      bodyHtml: `<p style="margin:0 0 10px">İlk siparişine özel hediyemiz:</p>
        <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px"><tr><td style="border:2px dashed #F5B800;border-radius:8px;padding:14px 24px;text-align:center">
          <span style="font-size:12px;color:#78716c">Kupon kodu</span><br>
          <span style="font-family:'Courier New',monospace;font-size:22px;font-weight:700;color:#1A1410;letter-spacing:2px">HOSGELDIN</span><br>
          <span style="font-size:13px;color:#16a34a;font-weight:700">%10 indirim</span>
        </td></tr></table>
        ${emailButton("Alışverişe başla", shopUrl)}
        <p style="margin:14px 0 0;color:#78716c;font-size:13px">✓ Ücretsiz tasarım desteği &nbsp;·&nbsp; ✓ 1-2 iş günü üretim &nbsp;·&nbsp; ✓ 81 ile kargo</p>`,
    });
    try {
      const info = await this.transporter.sendMail({ from: this.from, to, subject, text, html });
      await this.logNotification(to, "sent", { messageId: info.messageId, template: "welcome" }, subject);
      return true;
    } catch (err) {
      this.logger.warn(`mail.welcome failed to=${to}: ${(err as Error).message}`);
      await this.logNotification(to, "failed", { error: (err as Error).message, template: "welcome" }, subject);
      return false;
    }
  }

  /**
   * Teslimattan 24 saat sonra müşteriye yorum daveti — LifecycleService saatlik cron'u tetikler.
   * orderId + tek kullanımlık UUID token alır; bağlantı /yorum sayfasına yönlendirir.
   * HATA FIRLATMAZ (cron döngüsünü bloke etmez); başarı durumunu boolean döner.
   */
  async sendReviewInvitationEmail(orderId: string, token: string): Promise<boolean> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: { select: { fullName: true } },
        items: { select: { productName: true }, take: 1 },
      },
    });
    if (!order || !order.email) {
      this.logger.warn(`mail.reviewInvitation: sipariş/e-posta yok order=${orderId}`);
      return false;
    }
    if (!this.config.get<string>("SMTP_HOST")) {
      this.logger.log(
        `mail.reviewInvitation: SMTP_HOST yok → atlandı order=${order.orderNumber} to=${order.email}`,
      );
      await this.logNotification(order.email, "skipped", {
        template: "review-invitation",
        orderNumber: order.orderNumber,
        reason: "smtp-not-configured",
      });
      return false;
    }
    const esc = (s: unknown) =>
      String(s ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
    const name = (order.user?.fullName?.trim() || (order.shippingAddressSnapshot as { fullName?: string } | null)?.fullName?.trim()) ?? undefined;
    const greeting = name ? `Merhaba ${esc(name)},` : "Merhaba,";
    const webUrl = (this.config.get<string>("WEB_URL") ?? "https://markala.com.tr").replace(/\/$/, "");
    const reviewUrl = `${webUrl}/yorum?order=${encodeURIComponent(orderId)}&token=${encodeURIComponent(token)}`;
    const subject = "Siparişiniz teslim edildi, deneyiminizi paylaşır mısınız?";
    const text =
      `${name ? `Merhaba ${name},` : "Merhaba,"}\n\n` +
      `${order.orderNumber} numaralı siparişinizi teslim aldığınızı umuyoruz.\n\n` +
      `Deneyiminizi birkaç saniyede paylaşmak ister misiniz? Yorumlarınız hem bize ` +
      `hem de ilerleyen müşterilere rehberlik ediyor.\n\n` +
      `Yorum bırak: ${reviewUrl}\n\n` +
      `Bağlantı tek kullanımlıktır.\n\nMarkala`;
    const html = renderEmail({
      title: "Deneyiminizi Paylaşır mısınız? ⭐",
      intro: `${greeting} siparişinizi ulaştırdık, ne düşünüyorsunuz?`,
      preheader: `${esc(order.orderNumber)} teslim edildi, deneyiminizi paylaşır mısınız?`,
      bodyHtml: `<p style="margin:0 0 14px">
          ${order.items[0] ? `<strong>${esc(order.items[0].productName)}</strong> ve diğer ürünlerinizi teslim aldınız.` : "Siparişinizi teslim aldınız."}
          Deneyiminizi paylaşarak hem bize hem de diğer müşterilere yardımcı olabilirsiniz.
        </p>
        ${emailButton("⭐ Yorum bırak", reviewUrl)}
        ${emailFallbackLink(reviewUrl)}
        <p style="margin:14px 0 0;color:#78716c;font-size:13px">Bu bağlantı tek kullanımlıktır ve yalnızca size özeldir.</p>`,
    });
    try {
      const info = await this.transporter.sendMail({ from: this.from, to: order.email, subject, text, html });
      await this.logNotification(order.email, "sent", {
        messageId: info.messageId,
        template: "review-invitation",
        orderNumber: order.orderNumber,
      }, subject);
      return true;
    } catch (err) {
      this.logger.warn(`mail.reviewInvitation failed to=${order.email}: ${(err as Error).message}`);
      await this.logNotification(order.email, "failed", {
        error: (err as Error).message,
        template: "review-invitation",
        orderNumber: order.orderNumber,
      }, subject);
      return false;
    }
  }

  private async logNotification(
    recipient: string,
    status: "sent" | "failed" | "skipped",
    metadata: Record<string, unknown>,
    // GERÇEK e-posta konusu (2026-08-25, Hasan: panelde "hangi konulu mail gitmiş"
    // görünsün). Verilmezse eski davranış — şablon adı yazılır (geçmiş kayıtlar öyle).
    subject?: string,
  ) {
    // template metadata'dan türetilir; yalnız doğrulama mailleri template geçmez (varsayılan).
    // Eskiden her mail "email-verification" olarak loglanıyordu → şablon bazlı rapor kördü.
    const template = typeof metadata.template === "string" ? metadata.template : "email-verification";
    await this.prisma.notificationLog
      .create({
        data: {
          channel: "email",
          template,
          recipient,
          subject: subject ?? template,
          body: "",
          status,
          metadata: metadata as any,
        },
      })
      .catch((e) => this.logger.error(`notificationLog yazılamadı: ${(e as Error).message}`));
    // Arıza/düzelme uyarısı — fire-and-forget, gönderim akışını asla etkilemez (2026-09-03).
    void this.health?.kaydet(status, {
      recipient,
      subject: subject ?? template,
      error: typeof metadata.error === "string" ? metadata.error : undefined,
    });
  }
}
