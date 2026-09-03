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

  it("teslim maili → WhatsApp değerlendirme linki + doğru konu içerir", async () => {
    const prisma = {
      order: { findUnique: vi.fn().mockResolvedValue({ id: "o1", orderNumber: "MK-2026-0001", email: "m@x.com", user: { fullName: "Ayşe" } }) },
      notificationLog: { create: vi.fn().mockResolvedValue({}) },
    } as any;
    const svc = new MailService(cfg({ SMTP_HOST: "localhost", SMTP_PORT: "1025", WEB_URL: "https://markala.com.tr", WHATSAPP_NUMBER: "905319004102" }), prisma);
    const sendMail = vi.fn().mockResolvedValue({ messageId: "d1" });
    (svc as any).transporter = { sendMail };
    const ok = await svc.sendOrderDeliveredEmail("o1");
    expect(ok).toBe(true);
    const arg = sendMail.mock.calls[0][0];
    expect(arg.subject).toBe("Siparişiniz teslim edildi - Değerlendirmenizi paylaşır mısınız?");
    expect(arg.html).toContain("https://wa.me/905319004102");
    expect(arg.html).toContain("MK-2026-0001"); // orderNumber wa.me metnine gömülü (tireler encode edilmez)
    expect(prisma.notificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "sent", template: "order-delivered" }) }),
    );
  });

  it("teslim maili → SMTP_HOST yoksa gönderim ATLANIR, skipped loglanır", async () => {
    const prisma = {
      order: { findUnique: vi.fn().mockResolvedValue({ id: "o2", orderNumber: "MK-0002", email: "m@x.com", user: null }) },
      notificationLog: { create: vi.fn().mockResolvedValue({}) },
    } as any;
    const svc = new MailService(cfg({}), prisma); // SMTP_HOST tanımsız
    const sendMail = vi.fn();
    (svc as any).transporter = { sendMail };
    const ok = await svc.sendOrderDeliveredEmail("o2");
    expect(ok).toBe(false);
    expect(sendMail).not.toHaveBeenCalled();
    expect(prisma.notificationLog.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ status: "skipped", template: "order-delivered" }) }),
    );
  });
});
