import { Injectable, Logger, OnModuleInit, BadRequestException, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { ParasutService } from "../integrations/parasut/parasut.service";
import { MailService } from "../mail/mail.service";

/** Bir aylık faturalama sonucu (admin endpoint + zamanlanmış iş ortak döner tip). */
export interface MonthlyInvoiceResult {
  userId: string;
  email: string;
  period: string;
  orderCount: number;
  total: number;
  status: "issued" | "failed" | "skipped" | "already_invoiced" | "no_orders";
  parasutInvoiceId?: string;
}

/**
 * Faz 3 — Kurumsal (B2B) "cari hesap (açık hesap)" müşteriler için OTOMATİK AYLIK FATURALAMA.
 *
 * Her ay sonunda, önceki ayda açık-hesap (paymentMethod="cari") siparişi olan her onaylı
 * kurumsal müşteri için:
 *   1. O ayın siparişlerini tek bir aylık ekstre toplamında topla,
 *   2. Paraşüt üzerinden TEK e-fatura kes (parasut.createMonthlyStatementInvoice — sipariş
 *      bazlı fatura altyapısıyla aynı contact/product upsert mantığını paylaşır),
 *   3. Ekstre özetini müşteriye e-postayla gönder (mail.service).
 *
 * İdempotent: CorporateMonthlyInvoice (userId, period) benzersiz kaydıyla aynı müşteri/ay
 * iki kez faturalanmaz. Kayıt "pending" açılır, başarıda "issued" olur.
 *
 * Zamanlama: PaymentsService.reconcile ile AYNI mekanizma — @nestjs/schedule yok; OnModuleInit
 * + setInterval. Tek api instance'ı olduğundan setInterval yeterli (günlük kontrol, ay sonu çalışır).
 */
@Injectable()
export class CorporateInvoicingService implements OnModuleInit {
  private readonly logger = new Logger(CorporateInvoicingService.name);

  constructor(
    private prisma: PrismaService,
    private parasut: ParasutService,
    private mail: MailService,
  ) {}

  onModuleInit() {
    // Başlangıçtan 60sn sonra bir kez + her 24 saatte bir önceki ayı kontrol et.
    // Faturalama idempotent olduğundan günlük tetik güvenli: ay zaten faturalanmışsa atlanır.
    setTimeout(() => void this.runForPreviousMonthIfDue().catch((e) => this.logger.error('aylık faturalama bootstrap hatası', e)), 60_000);
    setInterval(() => void this.runForPreviousMonthIfDue().catch((e) => this.logger.error('aylık faturalama interval hatası', e)), 24 * 60 * 60_000).unref?.();
  }

  /** "YYYY-MM" → o ayın [başlangıç, sonraki ay başlangıcı) UTC aralığı. */
  private periodRange(period: string): { start: Date; end: Date } {
    const m = /^(\d{4})-(\d{2})$/.exec(period);
    if (!m) throw new BadRequestException("Geçersiz dönem (YYYY-MM bekleniyor).");
    const year = Number(m[1]);
    const month = Number(m[2]); // 1..12
    if (month < 1 || month > 12) throw new BadRequestException("Geçersiz ay.");
    const start = new Date(Date.UTC(year, month - 1, 1));
    const end = new Date(Date.UTC(year, month, 1));
    return { start, end };
  }

  /** Verilen tarihin bir önceki ayını "YYYY-MM" verir. */
  private previousMonthPeriod(now = new Date()): string {
    const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    d.setUTCMonth(d.getUTCMonth() - 1);
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
  }

  /**
   * ZAMANLANMIŞ İŞ: ay sonunda önceki ayı faturala. Sadece ayın ilk 5 gününde çalışır
   * (ay kapandıktan sonra), aksi halde no-op — gün içi tekrar tetiklemelerde boşa çalışmasın.
   */
  async runForPreviousMonthIfDue(): Promise<{ period: string; results: MonthlyInvoiceResult[] } | { skipped: true }> {
    const now = new Date();
    if (now.getUTCDate() > 5) return { skipped: true };
    const period = this.previousMonthPeriod(now);
    this.logger.log(`Aylık cari faturalama tetiklendi: dönem=${period}`);
    const results = await this.runForMonth(period);
    const issued = results.filter((r) => r.status === "issued").length;
    if (results.length) this.logger.log(`Aylık cari faturalama tamam: dönem=${period} ${issued}/${results.length} fatura kesildi`);
    return { period, results };
  }

  /** Bir ay için: açık-hesap siparişi olan TÜM onaylı kurumsal müşterileri faturala. */
  async runForMonth(period: string): Promise<MonthlyInvoiceResult[]> {
    const { start, end } = this.periodRange(period);

    // O ayda en az bir açık-hesap (cari) siparişi olan müşterileri bul.
    const grouped = await this.prisma.order.groupBy({
      by: ["userId"],
      where: {
        paymentMethod: "cari",
        userId: { not: null },
        deletedAt: null,
        createdAt: { gte: start, lt: end },
      },
      _count: { _all: true },
    });

    const results: MonthlyInvoiceResult[] = [];
    for (const g of grouped) {
      if (!g.userId) continue;
      results.push(await this.invoiceCustomerForMonth(g.userId, period));
    }
    return results;
  }

  /**
   * Tek müşteri + tek ay faturalama (admin elle tetik + toplu iş ortak çekirdek).
   * İdempotent: (userId, period) kaydı varsa ve "issued" ise tekrar faturalamaz.
   */
  async invoiceCustomerForMonth(userId: string, period: string): Promise<MonthlyInvoiceResult> {
    const { start, end } = this.periodRange(period);

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        fullName: true,
        companyName: true,
        taxNumber: true,
        taxOffice: true,
        phone: true,
        accountType: true,
        corporateStatus: true,
      },
    });
    if (!user) throw new NotFoundException("Müşteri bulunamadı.");
    if (user.accountType !== "corporate" || user.corporateStatus !== "approved") {
      throw new BadRequestException("Yalnızca onaylı kurumsal müşteriler için aylık faturalama yapılır.");
    }

    const baseResult: MonthlyInvoiceResult = {
      userId: user.id,
      email: user.email,
      period,
      orderCount: 0,
      total: 0,
      status: "no_orders",
    };

    // İdempotentlik: bu müşteri/ay daha önce başarıyla faturalandıysa tekrar etme.
    const existing = await this.prisma.corporateMonthlyInvoice.findUnique({
      where: { userId_period: { userId, period } },
    });
    if (existing && existing.status === "issued") {
      return {
        ...baseResult,
        orderCount: existing.orderCount,
        total: Number(existing.totalAmount),
        status: "already_invoiced",
        parasutInvoiceId: existing.parasutInvoiceId ?? undefined,
      };
    }

    const orders = await this.prisma.order.findMany({
      where: {
        userId,
        paymentMethod: "cari",
        deletedAt: null,
        createdAt: { gte: start, lt: end },
      },
      select: { orderNumber: true, total: true, createdAt: true, billingAddressSnapshot: true },
      orderBy: { createdAt: "asc" },
    });
    if (!orders.length) return baseResult;

    const total = Math.round(orders.reduce((s, o) => s + Number(o.total), 0) * 100) / 100;

    // İdempotent kayıt: "pending" upsert — faturalama sırasında çökersek bir sonraki tetik
    // (issued olmadığı için) tekrar dener.
    await this.prisma.corporateMonthlyInvoice.upsert({
      where: { userId_period: { userId, period } },
      create: {
        userId,
        period,
        totalAmount: new Prisma.Decimal(total),
        orderCount: orders.length,
        status: "pending",
      },
      update: {
        totalAmount: new Prisma.Decimal(total),
        orderCount: orders.length,
        status: "pending",
      },
    });

    // Fatura adresi snapshot'ından vergi bilgisi (yoksa user kurumsal alanlarına düş).
    const bill = (orders.find((o) => o.billingAddressSnapshot)?.billingAddressSnapshot ?? {}) as Record<string, unknown>;
    const companyName = user.companyName ?? user.fullName ?? user.email;

    const invoice = await this.parasut.createMonthlyStatementInvoice({
      contact: {
        email: user.email,
        fullName: companyName,
        taxNumber: user.taxNumber ?? (bill.taxNumber as string | undefined),
        taxOffice: user.taxOffice ?? (bill.taxOffice as string | undefined),
        phone: user.phone ?? undefined,
        address: bill.fullAddress as string | undefined,
        city: bill.city as string | undefined,
        district: bill.district as string | undefined,
      },
      period,
      lines: orders.map((o) => ({
        description: `Sipariş ${o.orderNumber} (${o.createdAt.toISOString().slice(0, 10)})`,
        grossAmount: Number(o.total),
      })),
    });

    const issued = invoice.status === "issued";
    await this.prisma.corporateMonthlyInvoice.update({
      where: { userId_period: { userId, period } },
      data: {
        status: invoice.status, // issued | failed | skipped
        parasutInvoiceId: invoice.invoiceId || null,
        issuedAt: issued ? new Date() : null,
      },
    });

    // Ekstre özetini müşteriye e-postayla bildir (fatura kesilmese de özet gönderilir).
    const mailSent = await this.mail.sendCorporateMonthlyStatementEmail({
      to: user.email,
      companyName,
      period,
      orders: orders.map((o) => ({
        orderNumber: o.orderNumber,
        date: o.createdAt.toISOString().slice(0, 10),
        amount: Number(o.total),
      })),
      total,
      invoiceIssued: issued,
    });
    if (!mailSent) {
      this.logger.warn(`aylık ekstre maili GÖNDERİLEMEDİ userId=${userId} email=${user.email} period=${period}`);
    }

    return {
      ...baseResult,
      orderCount: orders.length,
      total,
      status: invoice.status,
      parasutInvoiceId: invoice.invoiceId || undefined,
    };
  }
}
