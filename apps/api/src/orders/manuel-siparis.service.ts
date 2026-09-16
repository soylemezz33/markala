import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { MailService } from "../mail/mail.service";
import { LoyaltyService } from "../loyalty/loyalty.service";
import { generateOrderNumber } from "./orders.service";
import { ManuelSiparisDto } from "./manuel-siparis.dto";
import { epostaYerTutucu, manuelSiparisHesapla, manuelSiparisNotu } from "./manuel-siparis-kural";

/**
 * MANUEL SİPARİŞ (2026-09-16, Hasan: "yüz yüze bir iş aldık, havale ile ödendi; panelde manuel
 * sipariş ekle butonu olsun, ciroya dahil olsun, takibi kolay olsun").
 *
 * OrdersService.create'ten AYRI: o akış fiyatı ürün seçeneklerinden yeniden hesaplar (müşteriye
 * güvenilmez); burada personel fiyatı KDV dahil elle girer, katalog dışı kalem de olabilir.
 * Kayıt aynı Order/OrderItem tablolarına düşer → ciro, sipariş listesi, durum akışı, Chatwoot
 * konuşması (ödenmişse 2 dk içinde), kargoda e-Arşiv/e-Fatura aynen işler.
 *
 * NEDEN AYRI SERVİS: OrdersService'in kurucusu 36 spec tarafından elle kuruluyor (bkz.
 * order-design.service.ts başlığı) — oraya bağımlılık eklemek hepsine dokunmak olur.
 */
@Injectable()
export class ManuelSiparisService {
  private readonly logger = new Logger(ManuelSiparisService.name);
  constructor(
    private prisma: PrismaService,
    private mail: MailService,
    private loyalty: LoyaltyService,
  ) {}

  async olustur(dto: ManuelSiparisDto, actor: { actorId?: string | null; email?: string | null; role?: string | null; ipAddress?: string | null }) {
    // ── Müşteri ───────────────────────────────────────────────────────────────────────
    let userId: string | null = dto.userId ?? null;
    let email = (dto.email ?? "").trim().toLowerCase();
    if (userId) {
      const u = await this.prisma.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
      if (!u) throw new NotFoundException("Seçilen müşteri bulunamadı.");
      if (!email) email = u.email;
    } else if (email) {
      // Aynı e-postayla kayıtlı üye varsa siparişi ona bağla (Hesabım'da görür, puan kazanır).
      const u = await this.prisma.user.findUnique({ where: { email }, select: { id: true } });
      if (u) userId = u.id;
    }
    const epostaYok = !email;
    if (epostaYok) email = epostaYerTutucu(dto.phone);

    // ── Kalemler ──────────────────────────────────────────────────────────────────────
    const ids = [...new Set(dto.kalemler.map((k) => k.productId).filter((x): x is string => Boolean(x)))];
    const urunler = ids.length
      ? await this.prisma.product.findMany({ where: { id: { in: ids } }, select: { id: true, slug: true, name: true, images: true } })
      : [];
    const urun = new Map(urunler.map((u) => [u.id, u]));
    for (const id of ids) if (!urun.has(id)) throw new BadRequestException(`Ürün bulunamadı: ${id}`);

    const hesap = manuelSiparisHesapla(dto.kalemler, dto.indirim ?? 0, dto.teslimat === "kargo" ? (dto.kargoUcreti ?? 0) : 0);
    if (hesap.subtotal <= 0) throw new BadRequestException("Sipariş tutarı sıfır olamaz.");

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
        subtotal: new Prisma.Decimal(hesap.subtotal),
        shippingFee: new Prisma.Decimal(hesap.shippingFee),
        discount: new Prisma.Decimal(hesap.discount),
        vat: new Prisma.Decimal(hesap.vat),
        total: new Prisma.Decimal(hesap.total),
        marketingConsent: false,
        shippingAddressSnapshot: teslimatSnap as unknown as Prisma.InputJsonValue,
        billingAddressSnapshot: faturaSnap as unknown as Prisma.InputJsonValue,
        notes,
        items: {
          create: dto.kalemler.map((k, i) => {
            const p = k.productId ? urun.get(k.productId) : undefined;
            return {
              productId: p?.id,
              productSlug: p?.slug ?? "manuel",
              productName: k.productName.trim() || p?.name || "Manuel kalem",
              productImage: p?.images?.[0] ?? "",
              configurationSummary: (k.configurationSummary ?? "").trim() || "Manuel sipariş",
              configuration: { manuel: true, ...(k.configurationSummary ? { ozet: k.configurationSummary } : {}) } as Prisma.InputJsonValue,
              unitPrice: new Prisma.Decimal(k.unitPrice),
              quantity: k.quantity,
              lineTotal: new Prisma.Decimal(hesap.satirlar[i]),
              costTotal: k.costTotal == null ? null : new Prisma.Decimal(k.costTotal),
              needsDesignSupport: k.needsDesignSupport ?? false,
            };
          }),
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
            tutar: String(created.total), kalem: dto.kalemler.length, userId, epostaYok, role: actor.role ?? null,
          },
          ipAddress: actor.ipAddress ?? null,
        },
      })
      .catch((e) => this.logger.error(`manuel sipariş denetim kaydı: ${(e as Error).message}`));

    // Ödeme alındıysa üye müşteri puan kazanır (odemeOnayla ile aynı kural).
    if (dto.odemeAlindi && userId) void this.loyalty.earnForOrder(created.id).catch(() => undefined);
    // Müşteriye sipariş onayı yalnız istenirse ve gerçek e-posta varsa.
    if (dto.musteriyeEposta && !epostaYok) void this.mail.sendOrderConfirmationEmail(created.id).catch(() => undefined);

    this.logger.log(`manuel sipariş: ${created.orderNumber} ${hesap.total} ₺ ${dto.kanal}/${dto.odemeYontemi}${dto.odemeAlindi ? " ödendi" : ""} by ${olusturan}`);
    return { id: created.id, orderNumber: created.orderNumber, total: hesap.total, epostaYok };
  }
}
