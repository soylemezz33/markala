import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { LoyaltyService } from "../loyalty/loyalty.service";
import { SettingsService } from "../settings/settings.service";
import { generateOrderNumber } from "./orders.service";
import { ManuelFiyatDto, ManuelSiparisDto } from "./manuel-siparis.dto";
import { epostaYerTutucu, konfigurasyonOzeti, manuelSiparisHesapla, manuelSiparisNotu } from "./manuel-siparis-kural";
import {
  DEFAULT_PRICING,
  computeAreaLine,
  computeConfiguredPrice,
  normalizeSelections,
  type OptionRules,
  type PricingSettings,
} from "./pricing";
import { computeItemCostTotal } from "./costing";

const round2 = (n: number) => Math.round(n * 100) / 100;

/**
 * MANUEL SİPARİŞ (2026-09-16, Hasan: "yüz yüze bir iş aldık, havale ile ödendi; panelde manuel
 * sipariş ekle butonu olsun, ciroya dahil olsun, takibi kolay olsun").
 *
 * Katalog ürünü seçildiyse fiyat SİTEDEKİ MOTORLA hesaplanır (Hasan 14:01: "ölçü giremiyorum,
 * otomatik hesaplamıyor, ek işlem seçemiyorum"): normalizeSelections + computeConfiguredPrice /
 * computeAreaLine — orders.service.create ile aynı yol, aynı ayarlar (settings.getPricing).
 * Personel isterse fiyatı elle ezer (fiyatElle) ya da katalog dışı serbest kalem girer.
 *
 * OrdersService.create'ten AYRI (kurucusu 36 spec tarafından elle kuruluyor). Kayıt aynı
 * Order/OrderItem tablolarına düşer → ciro, sipariş listesi, durum akışı, Chatwoot konuşması
 * (ödenmişse 2 dk içinde), kargoda e-Arşiv/e-Fatura aynen işler.
 */
@Injectable()
export class ManuelSiparisService {
  private readonly logger = new Logger(ManuelSiparisService.name);
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private loyalty: LoyaltyService,
    private settings: SettingsService,
  ) {}

  private async urunGetir(productId: string) {
    const p = await this.prisma.product.findUnique({
      where: { id: productId },
      include: { options: { orderBy: [{ groupSort: "asc" }, { optionSort: "asc" }] }, prices: true },
    });
    if (!p) throw new NotFoundException(`Ürün bulunamadı: ${productId}`);
    return p;
  }

  /** Tek kalem fiyatı — form canlı özeti ve kayıt aynı fonksiyonu kullanır. */
  async fiyatla(dto: ManuelFiyatDto) {
    const product = await this.urunGetir(dto.productId);
    return this.kalemFiyatla(product, dto.selections ?? {}, dto.quantity);
  }

  private async kalemFiyatla(
    product: Awaited<ReturnType<ManuelSiparisService["urunGetir"]>>,
    rawSelections: Record<string, string>,
    quantity: number,
  ) {
    const opts = product.options.map((o) => ({
      ...o,
      groupRole: o.groupRole as "dimension" | "priced",
      locked: (o as unknown as { locked?: boolean }).locked ?? false,
      rules: ((o as unknown as { rules?: unknown }).rules as OptionRules | null) ?? null,
    }));
    const raw: Record<string, string> = {};
    for (const [k, v] of Object.entries(rawSelections ?? {})) if (typeof v === "string" || typeof v === "number") raw[k] = String(v);
    const selections = normalizeSelections(opts, raw);
    const prices = product.prices.map((r) => ({
      groupKey: r.groupKey, optionKey: r.optionKey, dimKey: r.dimKey,
      price: Number(r.price), cost: r.cost == null ? null : Number(r.cost),
    }));
    const isArea = product.pricingMode === "area";
    const pricing: PricingSettings = isArea ? await this.settings.getPricing() : DEFAULT_PRICING;
    const qty = Math.max(1, Math.floor(quantity));

    let unitPrice: number;
    let lineTotal: number;
    if (isArea) {
      const en = Number(selections.en) || 0;
      const boy = Number(selections.boy) || 0;
      if (en <= 0 || boy <= 0) throw new BadRequestException("Alan ürününde en ve boy (cm) gerekli.");
      const alanPiece = (en * boy) / 10000;
      const matOpt = opts.find((o) => o.groupKey === "malzeme" && o.optionKey === selections.malzeme);
      const mr = (matOpt?.rules ?? {}) as { maxM2?: number; minEn?: number; minBoy?: number };
      if (typeof mr.maxM2 === "number" && mr.maxM2 > 0 && alanPiece > mr.maxM2) throw new BadRequestException(`Bu malzeme tek parçada en fazla ${mr.maxM2} m² basılabilir.`);
      if (alanPiece > 100) throw new BadRequestException(`Geçersiz ölçü (tek parça ${alanPiece.toFixed(1)} m²).`);
      if (typeof mr.minEn === "number" && mr.minEn > 0 && en < mr.minEn) throw new BadRequestException(`En (genişlik) en az ${mr.minEn} cm olmalı.`);
      if (typeof mr.minBoy === "number" && mr.minBoy > 0 && boy < mr.minBoy) throw new BadRequestException(`Boy (uzunluk) en az ${mr.minBoy} cm olmalı.`);
      const line = computeAreaLine(opts as never, prices, selections, qty, pricing);
      unitPrice = line.unitPrice; lineTotal = line.lineTotal;
    } else {
      unitPrice = round2(computeConfiguredPrice(opts, prices, selections));
      lineTotal = round2(unitPrice * qty);
    }
    if (!Number.isFinite(unitPrice) || unitPrice <= 0) {
      throw new BadRequestException("Bu seçimler için fiyat tanımlı değil (Teklif Al ürünü olabilir); fiyatı elle girin.");
    }
    const costTotal = computeItemCostTotal(
      product as { pricingMode?: string | null; options?: unknown; prices?: unknown; content?: unknown },
      { selections }, qty, lineTotal / 1.2,
      Number(pricing.marj) > 0 ? Number(pricing.marj) : DEFAULT_PRICING.marj, pricing,
    );
    const summary = konfigurasyonOzeti(opts, selections);
    return { unitPrice, lineTotal, costTotal, summary, selections, pricingMode: product.pricingMode, productName: product.name };
  }

  async olustur(dto: ManuelSiparisDto, actor: { actorId?: string | null; email?: string | null; role?: string | null; ipAddress?: string | null }) {
    // ── Müşteri ───────────────────────────────────────────────────────────────────────
    let userId: string | null = dto.userId ?? null;
    let email = (dto.email ?? "").trim().toLowerCase();
    if (userId) {
      const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
      if (!u) throw new NotFoundException("Seçilen müşteri bulunamadı.");
      if (!email) email = u.email;
    } else if (email) {
      const u = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (u) userId = u.id;
    }
    const epostaYok = !email;
    if (epostaYok) email = epostaYerTutucu(dto.phone);

    // ── Kalemler: katalog ürünü → motor fiyatı (fiyatElle değilse); aksi halde elle ─────
    const kalemler: Array<{
      productId: string | null; productSlug: string; productName: string; productImage: string;
      configurationSummary: string; configuration: Prisma.InputJsonValue;
      unitPrice: number; quantity: number; lineTotal: number; costTotal: number | null; needsDesignSupport: boolean;
    }> = [];
    for (const k of dto.kalemler) {
      const qty = Math.max(1, Math.floor(k.quantity));
      const p = k.productId ? await this.urunGetir(k.productId) : null;
      if (p && !k.fiyatElle) {
        const f = await this.kalemFiyatla(p, k.selections ?? {}, qty);
        kalemler.push({
          productId: p.id, productSlug: p.slug, productName: p.name, productImage: p.images?.[0] ?? "",
          configurationSummary: (k.configurationSummary ?? "").trim() || f.summary || "Manuel sipariş",
          configuration: {
            selections: f.selections, summary: f.summary, totalPrice: f.unitPrice, manuel: true,
            ...(f.pricingMode === "area" ? { pricingMode: "area" } : {}),
          } as Prisma.InputJsonValue,
          unitPrice: f.unitPrice, quantity: qty, lineTotal: f.lineTotal, costTotal: f.costTotal,
          needsDesignSupport: k.needsDesignSupport ?? false,
        });
      } else {
        const unit = round2(Number(k.unitPrice ?? 0));
        if (!(unit > 0)) throw new BadRequestException(`"${k.productName}" için birim fiyat girin.`);
        kalemler.push({
          productId: p?.id ?? null, productSlug: p?.slug ?? "manuel", productName: k.productName.trim() || p?.name || "Manuel kalem",
          productImage: p?.images?.[0] ?? "",
          configurationSummary: (k.configurationSummary ?? "").trim() || "Manuel sipariş (elle fiyat)",
          configuration: { manuel: true, fiyatElle: true, ...(k.selections ? { selections: k.selections } : {}), ...(k.configurationSummary ? { summary: k.configurationSummary } : {}) } as Prisma.InputJsonValue,
          unitPrice: unit, quantity: qty, lineTotal: round2(unit * qty),
          costTotal: k.costTotal == null ? null : round2(k.costTotal), needsDesignSupport: k.needsDesignSupport ?? false,
        });
      }
    }
    const hesap = manuelSiparisHesapla(kalemler.map((k) => ({ quantity: k.quantity, unitPrice: k.unitPrice })), dto.indirim ?? 0, dto.teslimat === "kargo" ? (dto.kargoUcreti ?? 0) : 0);
    // Alan ürünlerinde lineTotal ≠ unitPrice×adet olabilir (1 m² tabanı) → satır toplamları motorun verdiğidir.
    const subtotal = round2(kalemler.reduce((s, k) => s + k.lineTotal, 0));
    const discount = round2(Math.min(hesap.discount, subtotal));
    const taxableGross = round2(subtotal - discount);
    const vat = round2(taxableGross - round2(taxableGross / 1.2));
    const total = round2(taxableGross + hesap.shippingFee);
    if (subtotal <= 0) throw new BadRequestException("Sipariş tutarı sıfır olamaz.");

    // ── Adres anlık görüntüleri ──────────────────────────────────────────────────────
    const eldenTeslim = {
      fullName: dto.fullName, phone: dto.phone, city: "-", district: "-",
      fullAddress: "Elden teslim (mağazadan alınacak)", label: "Elden teslim", type: "individual",
    };
    if (dto.teslimat === "kargo" && !dto.adres) throw new BadRequestException("Kargo teslimatında teslimat adresi gerekli.");
    const teslimatSnap = dto.teslimat === "kargo" && dto.adres ? { ...dto.adres, label: "Teslimat" } : eldenTeslim;
    const faturaSnap = dto.faturaAdresi
      ? { ...dto.faturaAdresi, label: "Fatura", type: dto.faturaAdresi.type ?? (dto.faturaAdresi.taxNumber ? "corporate" : "individual") }
      : { ...teslimatSnap, label: "Fatura", type: "individual" };
    if (faturaSnap.type === "corporate" && !/^\d{10}$/.test(String(faturaSnap.taxNumber ?? "").replace(/\D/g, ""))) {
      throw new BadRequestException("Kurumsal faturada 10 haneli vergi numarası gerekli.");
    }

    // ── Oluşturan personel ───────────────────────────────────────────────────────────
    const olusturanKaydi = actor.actorId
      ? await this.prisma.user.findUnique({ where: { id: actor.actorId }, select: { fullName: true, email: true } })
      : null;
    const olusturan = (olusturanKaydi?.fullName ?? "").trim() || olusturanKaydi?.email || actor.email || "panel";
    const notes = manuelSiparisNotu(dto.kanal, dto.odemeYontemi, olusturan, dto.odemeAlindi, dto.not);

    // ── Kayıt ─────────────────────────────────────────────────────────────────────────
    const created = await this.prisma.order.create({
      data: {
        orderNumber: generateOrderNumber(),
        userId,
        email,
        phone: dto.phone,
        status: "siparis_alindi",
        paymentStatus: dto.odemeAlindi ? "basarili" : "beklemede",
        paymentMethod: dto.odemeYontemi,
        subtotal: new Prisma.Decimal(subtotal),
        shippingFee: new Prisma.Decimal(hesap.shippingFee),
        discount: new Prisma.Decimal(discount),
        vat: new Prisma.Decimal(vat),
        total: new Prisma.Decimal(total),
        marketingConsent: false,
        // Fatura önden elle kesildiyse sistem ikinci kez kesmesin (2026-09-23).
        invoiceSkip: dto.faturaKesilmesin === true,
        shippingAddressSnapshot: teslimatSnap as unknown as Prisma.InputJsonValue,
        billingAddressSnapshot: faturaSnap as unknown as Prisma.InputJsonValue,
        notes,
        items: {
          create: kalemler.map((k) => ({
            productId: k.productId ?? undefined,
            productSlug: k.productSlug,
            productName: k.productName,
            productImage: k.productImage,
            configurationSummary: k.configurationSummary,
            configuration: k.configuration,
            unitPrice: new Prisma.Decimal(k.unitPrice),
            quantity: k.quantity,
            lineTotal: new Prisma.Decimal(k.lineTotal),
            costTotal: k.costTotal == null ? null : new Prisma.Decimal(k.costTotal),
            needsDesignSupport: k.needsDesignSupport,
          })),
        },
      },
      select: { id: true, orderNumber: true, total: true },
    });

    await this.prisma.auditLog
      .create({
        data: {
          actorId: actor.actorId ?? null,
          entityType: "Order",
          entityId: created.id,
          action: "manuel_siparis",
          diff: {
            orderNumber: created.orderNumber, kanal: dto.kanal, odemeYontemi: dto.odemeYontemi, odemeAlindi: dto.odemeAlindi,
            tutar: String(created.total), kalem: kalemler.length, userId, epostaYok, role: actor.role ?? null,
            faturaKesilmesin: dto.faturaKesilmesin === true,
          },
          ipAddress: actor.ipAddress ?? null,
        },
      })
      .catch((e) => this.logger.error(`manuel sipariş denetim kaydı: ${(e as Error).message}`));

    if (dto.odemeAlindi && userId) void this.loyalty.earnForOrder(created.id).catch(() => undefined);
    if (dto.musteriyeEposta && !epostaYok) void this.mail.sendOrderConfirmationEmail(created.id).catch(() => undefined);

    this.logger.log(`manuel sipariş: ${created.orderNumber} ${total} ₺ ${dto.kanal}/${dto.odemeYontemi}${dto.odemeAlindi ? " ödendi" : ""} by ${olusturan}`);
    return { id: created.id, orderNumber: created.orderNumber, total, epostaYok };
  }
}
