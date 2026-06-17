import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Iyzipay from "iyzipay";
import { PrismaService } from "../prisma/prisma.service";
import { IyzicoService } from "../integrations/iyzico/iyzico.service";
import { verifyPaymentNonce } from "./payment-nonce";

interface AddressView {
  fullName?: string;
  phone?: string;
  city?: string;
  district?: string;
  fullAddress?: string;
  zipCode?: string;
}

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private iyzico: IyzicoService,
    private config: ConfigService,
  ) {}

  private addrOf(fk: unknown, snap: unknown): AddressView {
    return ((fk ?? snap ?? {}) as AddressView) || {};
  }

  private splitName(full?: string): { name: string; surname: string } {
    const parts = (full ?? "").trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return { name: "Müşteri", surname: "Müşteri" };
    if (parts.length === 1) return { name: parts[0], surname: parts[0] };
    return { name: parts.slice(0, -1).join(" "), surname: parts[parts.length - 1] };
  }

  /** Telefonu iyzico'nun beklediği +90... biçimine getirir (best-effort). */
  private gsm(phone?: string): string {
    const d = (phone ?? "").replace(/\D/g, "");
    if (!d) return "+905000000000";
    if (d.startsWith("90")) return `+${d}`;
    if (d.startsWith("0")) return `+90${d.slice(1)}`;
    if (d.length === 10) return `+90${d}`;
    return `+${d}`;
  }

  /**
   * Sipariş kalemlerini iyzico sepetine çevirir. iyzico, sepet kalem fiyatları toplamının
   * `price`'a BİREBİR eşit olmasını ister → tüm hesap kuruş (integer) üzerinden yapılır,
   * kupon indirimi ürün kalemlerine oransal dağıtılır, kargo ayrı kalem, yuvarlama farkı
   * son kaleme yedirilir. Sonuç toplamı tam `order.total`.
   */
  private buildBasket(order: {
    total: unknown;
    subtotal: unknown;
    discount: unknown;
    shippingFee: unknown;
    items: Array<{ productSlug?: string | null; id?: string; productName?: string | null; lineTotal: unknown }>;
  }): { basketItems: Array<Record<string, unknown>>; price: string } {
    const totalKurus = Math.round(Number(order.total) * 100);
    const subtotalKurus = Math.round(Number(order.subtotal) * 100);
    const discountKurus = Math.round(Number(order.discount) * 100);
    const shippingKurus = Math.round(Number(order.shippingFee) * 100);
    const itemsNetKurus = Math.max(0, subtotalKurus - discountKurus);

    const raw: Array<{ id: string; name: string; kurus: number; shipping?: boolean }> = [];
    let allocated = 0;
    order.items.forEach((it, idx) => {
      const lineKurus = Math.round(Number(it.lineTotal) * 100);
      const share = subtotalKurus > 0 ? Math.round((lineKurus * itemsNetKurus) / subtotalKurus) : lineKurus;
      raw.push({
        id: String(it.productSlug ?? it.id ?? `item-${idx}`).slice(0, 60),
        name: String(it.productName ?? "Ürün").slice(0, 100),
        kurus: share,
      });
      allocated += share;
    });
    // Ürün kalemleri toplamını tam itemsNetKurus'a sabitle (oransal yuvarlama farkını son kaleme yedir).
    if (raw.length) raw[raw.length - 1].kurus += itemsNetKurus - allocated;
    if (shippingKurus > 0) raw.push({ id: "kargo", name: "Kargo", kurus: shippingKurus, shipping: true });

    // Güvenlik kemeri: tüm sepet toplamı tam order.total olsun.
    const sumNow = raw.reduce((s, r) => s + r.kurus, 0);
    if (raw.length && sumNow !== totalKurus) raw[raw.length - 1].kurus += totalKurus - sumNow;

    const basketItems = raw.map((r) => ({
      id: r.id,
      name: r.name,
      category1: r.shipping ? "Kargo" : "Matbaa & Reklam",
      itemType: Iyzipay.BASKET_ITEM_TYPE.PHYSICAL,
      price: (r.kurus / 100).toFixed(2),
    }));
    return { basketItems, price: (totalKurus / 100).toFixed(2) };
  }

  /** Sipariş için iyzico Checkout Form başlatır; hosted ödeme sayfası URL'ini döndürür. */
  async initCheckout(
    orderId: string,
    nonce: string,
    clientIp?: string,
  ): Promise<{ paymentPageUrl?: string; checkoutFormContent?: string; token?: string }> {
    if (!this.iyzico.isConfigured()) {
      throw new ServiceUnavailableException("Ödeme sistemi şu an kullanılamıyor.");
    }
    // IDOR koruması: nonce sipariş oluşturma yanıtında verilir; gizli anahtar olmadan üretilemez.
    // Geçersizse "bulunamadı" (varlık sızdırmamak için, DB'ye bile gitmeden).
    const secret = this.config.get<string>("JWT_SECRET") ?? "";
    if (!verifyPaymentNonce(secret, orderId, nonce)) {
      throw new NotFoundException("Sipariş bulunamadı.");
    }
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, shippingAddress: true, billingAddress: true },
    });
    if (!order) throw new NotFoundException("Sipariş bulunamadı.");
    if (order.paymentStatus === "basarili") throw new BadRequestException("Bu sipariş zaten ödenmiş.");
    if (Number(order.total) <= 0) throw new BadRequestException("Geçersiz tutar.");

    const ship = this.addrOf(order.shippingAddress, order.shippingAddressSnapshot);
    const bill = this.addrOf(order.billingAddress, order.billingAddressSnapshot ?? order.shippingAddressSnapshot);
    const { name, surname } = this.splitName(ship.fullName ?? order.email);
    const { basketItems, price } = this.buildBasket(order);

    const apiBase = this.config.get<string>("API_PUBLIC_URL") ?? "http://localhost:4000";
    const callbackUrl = `${apiBase}/api/payments/iyzico/callback`;
    const buyerAddress = ship.fullAddress || "Adres belirtilmedi";

    const request: Record<string, unknown> = {
      locale: Iyzipay.LOCALE.TR,
      conversationId: order.id,
      price,
      paidPrice: price,
      currency: Iyzipay.CURRENCY.TRY,
      basketId: order.orderNumber,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl,
      enabledInstallments: [1, 2, 3, 6, 9],
      buyer: {
        id: order.userId ?? order.id,
        name,
        surname,
        gsmNumber: this.gsm(ship.phone ?? order.phone),
        email: order.email,
        identityNumber: "11111111111", // iyzico zorunlu KYC alanı; gerçek TC saklanmıyor → placeholder
        registrationAddress: buyerAddress,
        ip: clientIp || "0.0.0.0",
        city: ship.city || "Bilinmiyor",
        country: "Turkey",
        zipCode: ship.zipCode || undefined,
      },
      shippingAddress: {
        contactName: ship.fullName || name,
        city: ship.city || "Bilinmiyor",
        country: "Turkey",
        address: buyerAddress,
        zipCode: ship.zipCode || undefined,
      },
      billingAddress: {
        contactName: bill.fullName || ship.fullName || name,
        city: bill.city || ship.city || "Bilinmiyor",
        country: "Turkey",
        address: bill.fullAddress || buyerAddress,
        zipCode: bill.zipCode || ship.zipCode || undefined,
      },
      basketItems,
    };

    const res = await this.iyzico.initializeCheckoutForm(request);
    if (res.status !== "success") {
      this.logger.warn(`iyzico init başarısız order=${orderId}: ${res.errorMessage}`);
      throw new ServiceUnavailableException("Ödeme başlatılamadı, lütfen tekrar deneyin.");
    }
    return { paymentPageUrl: res.paymentPageUrl, checkoutFormContent: res.checkoutFormContent, token: res.token };
  }

  /**
   * iyzico callback'i: token ile sonucu doğrular, sipariş paymentStatus'unu günceller,
   * tarayıcının yönlendirileceği web URL'ini döndürür. Token'a güvenmez — sonuç iyzico'dan
   * `retrieve` ile çekilir (sahte callback POST'u retrieve'de başarısız olur).
   */
  async handleCallback(token: string): Promise<{ redirectUrl: string }> {
    const webOrigin = (this.config.get<string>("WEB_ORIGIN") ?? "http://localhost:3000").split(",")[0];
    if (!token) return { redirectUrl: `${webOrigin}/odeme/hata` };

    const result = await this.iyzico.retrieveCheckoutForm(token);
    const orderId = result.conversationId;
    if (!orderId) return { redirectUrl: `${webOrigin}/odeme/hata` };

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, paymentStatus: true, orderNumber: true, total: true },
    });
    if (!order) return { redirectUrl: `${webOrigin}/odeme/hata` };

    // Callback özgünlüğü: iyzico'dan dönen kayıt bu siparişe ait ve tutar BEKLENEN ile aynı mı?
    // (token sahte olsa retrieve başarısız olur; ayrıca basketId/paidPrice çapraz-sipariş/tutar
    //  oynamasını yakalar.) Uyuşmazlıkta hiçbir statü değiştirmeyiz — manuel inceleme.
    const basketOk = result.basketId === order.orderNumber;
    const paidKurus = Math.round(Number(result.paidPrice) * 100);
    const expectedKurus = Math.round(Number(order.total) * 100);
    const amountOk = Number.isFinite(paidKurus) && paidKurus === expectedKurus;

    if (result.status === "success") {
      if (!basketOk || !amountOk) {
        this.logger.error(
          `iyzico DOĞRULAMA UYUŞMAZLIĞI order=${orderId} basketId=${result.basketId} beklenen=${order.orderNumber} ` +
            `paidPrice=${result.paidPrice} beklenenTutar=${order.total} → ödeme işaretlenmedi, MANUEL İNCELEME`,
        );
        return { redirectUrl: `${webOrigin}/odeme/hata?siparis=${orderId}` };
      }
      if (order.paymentStatus !== "basarili") {
        await this.prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: "basarili",
            iyzicoPaymentId: result.paymentId ?? undefined,
            iyzicoConversationId: orderId,
          },
        });
      }
      this.logger.log(`iyzico ödeme BAŞARILI order=${orderId} payment=${result.paymentId} tutar=${result.paidPrice}`);
      return { redirectUrl: `${webOrigin}/odeme/basarili/${orderId}` };
    }

    // Başarısız: yalnız hâlâ beklemede VE bu siparişe ait callback ise işaretle (griefing/çapraz koruması).
    if (order.paymentStatus === "beklemede" && basketOk) {
      await this.prisma.order.update({ where: { id: orderId }, data: { paymentStatus: "basarisiz" } });
    }
    this.logger.warn(`iyzico ödeme BAŞARISIZ order=${orderId}: ${result.paymentStatus} ${result.errorMessage}`);
    return { redirectUrl: `${webOrigin}/odeme/hata?siparis=${orderId}` };
  }
}
