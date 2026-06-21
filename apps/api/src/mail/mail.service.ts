import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { PrismaService } from "../prisma/prisma.service";
import { renderEmail, emailButton, emailFallbackLink } from "./email-layout";

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly from: string;
  private transporter: Transporter;

  constructor(private config: ConfigService, private prisma: PrismaService) {
    const secure = (this.config.get<string>("SMTP_SECURE") ?? "false") === "true";
    const user = this.config.get<string>("SMTP_USER");
    const pass = this.config.get<string>("SMTP_PASS");
    this.from = this.config.get<string>("MAIL_FROM") ?? "Markala <markala@324ajans.com>";
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
    const subject = "Markala — E-posta adresinizi doğrulayın";
    const text = `Markala hesabınızı etkinleştirmek için bağlantıya tıklayın:\n${verifyUrl}\n\nBağlantı 24 saat geçerlidir. Bu işlemi siz başlatmadıysanız e-postayı yok sayın.\n\nMarkala — 324 Ajans BT tarafından gönderilmiştir (işlemsel ileti).`;
    const html = renderEmail({
      title: "Markala'ya hoş geldiniz 👋",
      intro: "Hesabınızı etkinleştirmek için e-posta adresinizi doğrulayın.",
      preheader: "E-posta adresinizi doğrulayın — bağlantı 24 saat geçerli.",
      bodyHtml: `<p style="margin:0">Hesabınızı etkinleştirmek için aşağıdaki butona tıklayın:</p>
        ${emailButton("E-postamı doğrula", verifyUrl)}
        ${emailFallbackLink(verifyUrl)}
        <p style="margin:14px 0 0;color:#78716c;font-size:13px">Bağlantı 24 saat geçerlidir. Bu işlemi siz başlatmadıysanız e-postayı yok sayın.</p>`,
    });

    try {
      const info = await this.transporter.sendMail({ from: this.from, to, subject, text, html });
      await this.logNotification(to, "sent", { messageId: info.messageId });
      return true;
    } catch (err) {
      this.logger.warn(`mail.verification failed to=${to}: ${(err as Error).message}`);
      await this.logNotification(to, "failed", { error: (err as Error).message });
      return false;
    }
  }

  /** Şifre sıfırlama maili. HATA FIRLATMAZ — akışı bloke etmez (enumeration koruması için sessiz başarı). */
  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<boolean> {
    const subject = "Markala — Şifre sıfırlama talebi";
    const text = `Markala hesabınızın şifresini sıfırlamak için bağlantıya tıklayın:\n${resetUrl}\n\nBağlantı 1 saat geçerlidir. Bu talebi siz oluşturmadıysanız e-postayı yok sayın; şifreniz değişmez.\n\nMarkala — 324 Ajans BT tarafından gönderilmiştir (işlemsel ileti).`;
    const html = renderEmail({
      title: "Şifre Sıfırlama",
      intro: "Markala hesabınızın şifresini sıfırlama talebi aldık.",
      preheader: "Şifre sıfırlama bağlantısı — 1 saat geçerli.",
      bodyHtml: `<p style="margin:0">Şifrenizi sıfırlamak için aşağıdaki butona tıklayın:</p>
        ${emailButton("Şifremi sıfırla", resetUrl)}
        ${emailFallbackLink(resetUrl)}
        <p style="margin:14px 0 0;color:#78716c;font-size:13px">Bağlantı 1 saat geçerlidir. Bu talebi siz oluşturmadıysanız bu e-postayı yok sayın — şifreniz değişmez.</p>`,
    });

    try {
      const info = await this.transporter.sendMail({ from: this.from, to, subject, text, html });
      await this.logNotification(to, "sent", { messageId: info.messageId, template: "password-reset" });
      return true;
    } catch (err) {
      this.logger.warn(`mail.passwordReset failed to=${to}: ${(err as Error).message}`);
      await this.logNotification(to, "failed", { error: (err as Error).message, template: "password-reset" });
      return false;
    }
  }

  /** Kurumsal başvuru onayında: hesabı aktive et + şifre belirleme (davet) bağlantısı. */
  async sendCorporateInviteEmail(to: string, inviteUrl: string, companyName: string): Promise<boolean> {
    // companyName kullanıcı-kontrollü (başvuru formu) → HTML injection'a karşı escape et.
    const safeCompany = String(companyName)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
    const subject = "Markala — Kurumsal hesabınız onaylandı";
    const text = `${companyName} kurumsal hesabınız onaylandı. Panele giriş için önce şifrenizi belirleyin:\n${inviteUrl}\n\nBağlantı 7 gün geçerlidir.\n\nMarkala — 324 Ajans BT (işlemsel ileti).`;
    const html = renderEmail({
      title: "Kurumsal Hesabınız Onaylandı 🎉",
      intro: `${safeCompany} için kurumsal hesabınız aktif edildi.`,
      preheader: "Kurumsal hesabınız onaylandı — şifrenizi belirleyin.",
      bodyHtml: `<p style="margin:0">Panele giriş yapmak için önce şifrenizi belirleyin:</p>
        ${emailButton("Şifremi belirle ve giriş yap", inviteUrl)}
        ${emailFallbackLink(inviteUrl)}
        <p style="margin:14px 0 0;color:#78716c;font-size:13px">Bağlantı 7 gün geçerlidir. Giriş sonrası firmanıza özel fiyatlarınız, sipariş geçmişiniz ve hesabınız tek panelde.</p>`,
    });

    try {
      const info = await this.transporter.sendMail({ from: this.from, to, subject, text, html });
      await this.logNotification(to, "sent", { messageId: info.messageId, template: "corporate-invite" });
      return true;
    } catch (err) {
      this.logger.warn(`mail.corporateInvite failed to=${to}: ${(err as Error).message}`);
      await this.logNotification(to, "failed", { error: (err as Error).message, template: "corporate-invite" });
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

    const subject = `Markala — ${input.period} dönemi cari hesap ekstresi`;
    const rowsText = input.orders
      .map((o) => `  • ${o.orderNumber} (${o.date}) — ${fmt(o.amount)} ₺`)
      .join("\n");
    const invoiceNote = input.invoiceIssued
      ? "Bu döneme ait e-faturanız Paraşüt üzerinden düzenlenmiştir."
      : "Bu döneme ait fatura kaydı oluşturulmuştur.";
    const text =
      `${input.companyName} — ${input.period} dönemi açık hesap (cari) ekstresi:\n\n` +
      `${rowsText}\n\n` +
      `Toplam: ${fmt(input.total)} ₺ (${input.orders.length} sipariş)\n\n` +
      `${invoiceNote}\n\nMarkala — 324 Ajans BT tarafından gönderilmiştir.`;

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
      intro: `${esc(input.companyName)} — açık hesap (cari) sipariş özeti`,
      preheader: `${esc(input.period)} ekstresi — toplam ${fmt(input.total)} ₺`,
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
      await this.logNotification(input.to, "sent", { messageId: info.messageId, template: "corporate-monthly-statement", period: input.period });
      return true;
    } catch (err) {
      this.logger.warn(`mail.corporateMonthlyStatement failed to=${input.to}: ${(err as Error).message}`);
      await this.logNotification(input.to, "failed", { error: (err as Error).message, template: "corporate-monthly-statement", period: input.period });
      return false;
    }
  }

  private async logNotification(recipient: string, status: "sent" | "failed", metadata: Record<string, unknown>) {
    await this.prisma.notificationLog
      .create({
        data: {
          channel: "email",
          template: "email-verification",
          recipient,
          subject: "E-posta doğrulama",
          body: "",
          status,
          metadata: metadata as any,
        },
      })
      .catch((e) => this.logger.error(`notificationLog yazılamadı: ${(e as Error).message}`));
  }
}
