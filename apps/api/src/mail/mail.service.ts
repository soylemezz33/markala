import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";
import { PrismaService } from "../prisma/prisma.service";

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
    });
  }

  /** İşlemsel doğrulama maili. HATA FIRLATMAZ — register'ı bloke etmez. */
  async sendVerificationEmail(to: string, verifyUrl: string): Promise<boolean> {
    const subject = "Markala — E-posta adresinizi doğrulayın";
    const text = `Markala hesabınızı etkinleştirmek için bağlantıya tıklayın:\n${verifyUrl}\n\nBağlantı 24 saat geçerlidir. Bu işlemi siz başlatmadıysanız e-postayı yok sayın.\n\nMarkala — 324 Ajans BT tarafından gönderilmiştir (işlemsel ileti).`;
    const html = `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto">
      <h2 style="color:#1a1a1a">Markala'ya hoş geldin 👋</h2>
      <p>Hesabını etkinleştirmek için aşağıdaki butona tıkla:</p>
      <p><a href="${verifyUrl}" style="display:inline-block;background:#F5B800;color:#1a1a1a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">E-postamı doğrula</a></p>
      <p style="color:#666;font-size:13px">Bağlantı 24 saat geçerlidir. Buton çalışmazsa: <br><a href="${verifyUrl}">${verifyUrl}</a></p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
      <p style="color:#999;font-size:12px">Bu işlemsel bir iletidir. Markala — 324 Ajans BT tarafından gönderilmiştir.</p>
    </div>`;

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
    const html = `<div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto">
      <h2 style="color:#1a1a1a">Şifre sıfırlama</h2>
      <p>Markala hesabının şifresini sıfırlamak için aşağıdaki butona tıkla:</p>
      <p><a href="${resetUrl}" style="display:inline-block;background:#F5B800;color:#1a1a1a;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600">Şifremi sıfırla</a></p>
      <p style="color:#666;font-size:13px">Bağlantı 1 saat geçerlidir. Buton çalışmazsa: <br><a href="${resetUrl}">${resetUrl}</a></p>
      <p style="color:#666;font-size:13px">Bu talebi sen oluşturmadıysan bu e-postayı yok say — şifren değişmez.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0">
      <p style="color:#999;font-size:12px">Bu işlemsel bir iletidir. Markala — 324 Ajans BT tarafından gönderilmiştir.</p>
    </div>`;

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
