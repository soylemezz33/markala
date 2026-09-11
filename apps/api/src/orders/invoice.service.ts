import { Injectable, Logger, NotFoundException, ForbiddenException } from "@nestjs/common";
import { Cron } from "@nestjs/schedule";
import { PrismaService } from "../prisma/prisma.service";
import { ParasutService } from "../integrations/parasut/parasut.service";
import { StorageService } from "../storage/storage.service";
import { MailService } from "../mail/mail.service";

/**
 * FATURA RESMİLEŞTİRME (2026-09-11, Hasan: "kargoya verildiğinde otomatik fatura kesilsin,
 * müşteriye e-posta gitsin").
 *
 * Eski durum: kargoya-verildi'de Paraşüt'te TASLAK sales_invoice açılıyor, resmileşmiyor, PDF
 * alınmıyor, mail gitmiyordu; müşteri paneli ise "e-posta ile gönderildi" yazıyordu.
 *
 * Akış (OrdersService.issueInvoiceIfNeeded taslağı bağladıktan sonra çağırır):
 *  1. ParasutService.finalizeEDocument → e-Arşiv (bireysel / mükellef olmayan) ya da e-Fatura
 *     (VKN'si GİB'de kayıtlı kurumsal); trackable job biter, belge no + PDF gelir.
 *  2. PDF sunucuya yazılır (secure/fatura-<no>.pdf), Order alanları dolar.
 *  3. Müşteriye PDF ekli fatura e-postası gider (invoiceMailedAt).
 * Hata → invoiceError + invoiceAttempts; saatlik cron 5 denemeye kadar tekrar eder (Paraşüt
 * işleri asenkron, GİB gecikmeleri olağan). Sipariş akışı HİÇBİR koşulda bloke olmaz.
 */
const MAX_ATTEMPTS = 5;

@Injectable()
export class InvoiceService {
  private readonly logger = new Logger(InvoiceService.name);
  constructor(
    private prisma: PrismaService,
    private parasut: ParasutService,
    private storage: StorageService,
    private mail: MailService,
  ) {}

  /** Tek sipariş: resmileştir + PDF + mail. Hata fırlatmaz; sonucu döner. */
  async finalize(orderId: string): Promise<{ ok: boolean; invoiceNumber?: string; reason?: string }> {
    const o = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderNumber: true, parasutInvoiceId: true, invoiceNumber: true, invoiceAttempts: true, invoiceMailedAt: true, invoicePdfKey: true },
    });
    if (!o) return { ok: false, reason: "sipariş yok" };
    if (!o.parasutInvoiceId) return { ok: false, reason: "taslak yok" };
    if (o.invoiceNumber && o.invoiceMailedAt) return { ok: true, invoiceNumber: o.invoiceNumber };
    if (o.invoiceAttempts >= MAX_ATTEMPTS) return { ok: false, reason: "deneme sınırı" };

    try {
      let invoiceNumber = o.invoiceNumber;
      let pdfKey = o.invoicePdfKey;
      let invoiceType: string | undefined;
      if (!invoiceNumber || !pdfKey) {
        const r = await this.parasut.finalizeEDocument(orderId);
        invoiceNumber = r.invoiceNumber;
        invoiceType = r.type;
        pdfKey = await this.storage.putInvoicePdf(o.orderNumber, r.pdf);
        await this.prisma.order.update({
          where: { id: orderId },
          data: { invoiceNumber, invoiceType, invoicePdfKey: pdfKey, invoiceIssuedAt: new Date(), invoiceError: null },
        });
        this.logger.log(`Fatura resmileşti: order=${o.orderNumber} no=${invoiceNumber} tür=${invoiceType}`);
      }
      // Mail: PDF diskten (yeniden gönderimde de aynı yol)
      const { buffer } = await this.storage.getSecure(pdfKey!);
      const sent = await this.mail.sendInvoiceEmail(orderId, { pdf: buffer, invoiceNumber: invoiceNumber!, invoiceType: invoiceType ?? undefined });
      if (sent) await this.prisma.order.update({ where: { id: orderId }, data: { invoiceMailedAt: new Date() } });
      return { ok: true, invoiceNumber: invoiceNumber! };
    } catch (e) {
      const msg = (e as Error).message?.slice(0, 500) ?? "bilinmeyen hata";
      await this.prisma.order.update({ where: { id: orderId }, data: { invoiceError: msg, invoiceAttempts: { increment: 1 } } }).catch(() => undefined);
      this.logger.warn(`Fatura resmileştirilemedi (deneme ${o.invoiceAttempts + 1}/${MAX_ATTEMPTS}) order=${o.orderNumber}: ${msg}`);
      return { ok: false, reason: msg };
    }
  }

  /** Bekleyenler: taslağı var, belge no veya maili eksik, deneme sınırı altında. */
  async retryPending(): Promise<{ denenen: number; basarili: number }> {
    const list = await this.prisma.order.findMany({
      where: { parasutInvoiceId: { not: null }, deletedAt: null, invoiceAttempts: { lt: MAX_ATTEMPTS }, OR: [{ invoiceNumber: null }, { invoiceMailedAt: null }] },
      select: { id: true },
      take: 50,
      orderBy: { createdAt: "asc" },
    });
    let basarili = 0;
    for (const o of list) if ((await this.finalize(o.id)).ok) basarili++;
    if (list.length) this.logger.log(`Fatura tamamlama: ${basarili}/${list.length}`);
    return { denenen: list.length, basarili };
  }

  @Cron("15 * * * *", { name: "fatura-tamamla", timeZone: "Europe/Istanbul" })
  async cronRetry(): Promise<void> {
    if (!this.parasut.isConfigured()) return;
    await this.retryPending().catch((e) => this.logger.error(`fatura-tamamla cron: ${(e as Error).message}`));
  }

  /** PDF indirme — müşteri yalnız kendi siparişi, panel rolleri hepsi. */
  async getPdf(orderId: string, userId: string | undefined, role: string): Promise<{ buffer: Buffer; fileName: string }> {
    const o = await this.prisma.order.findUnique({ where: { id: orderId }, select: { userId: true, orderNumber: true, invoicePdfKey: true, invoiceNumber: true } });
    if (!o || !o.invoicePdfKey) throw new NotFoundException("Fatura henüz hazır değil.");
    if (role === "customer" && o.userId !== userId) throw new ForbiddenException();
    const { buffer } = await this.storage.getSecure(o.invoicePdfKey);
    return { buffer, fileName: `Fatura-${o.invoiceNumber ?? o.orderNumber}.pdf` };
  }
}
