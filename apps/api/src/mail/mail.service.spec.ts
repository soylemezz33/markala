import { describe, it, expect, vi } from "vitest";
import { MailService } from "./mail.service";

function cfg(v: Record<string, any>) { return { get: (k: string) => v[k] } as any; }

describe("MailService", () => {
  it("başarılı gönderim → true + NotificationLog sent", async () => {
    const prisma = { notificationLog: { create: vi.fn().mockResolvedValue({}) } } as any;
    const svc = new MailService(cfg({ SMTP_HOST: "localhost", SMTP_PORT: "1025", SMTP_SECURE: "false", MAIL_FROM: "Markala <markala@324ajans.com>" }), prisma);
    (svc as any).transporter = { sendMail: vi.fn().mockResolvedValue({ messageId: "m1" }) };
    const ok = await svc.sendVerificationEmail("u@x.com", "https://markala.com.tr/eposta-dogrula?token=t");
    expect(ok).toBe(true);
    expect(prisma.notificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "sent", recipient: "u@x.com", template: "email-verification" }) }),
    );
  });

  it("SMTP hatası → throw ETMEZ, false döner + NotificationLog failed", async () => {
    const prisma = { notificationLog: { create: vi.fn().mockResolvedValue({}) } } as any;
    const svc = new MailService(cfg({ SMTP_HOST: "localhost", SMTP_PORT: "1025", MAIL_FROM: "x" }), prisma);
    (svc as any).transporter = { sendMail: vi.fn().mockRejectedValue(new Error("ECONNREFUSED")) };
    const ok = await svc.sendVerificationEmail("u@x.com", "https://x/t");
    expect(ok).toBe(false);
    expect(prisma.notificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "failed" }) }),
    );
  });
});
