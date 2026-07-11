import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ServiceUnavailableException,
  OnModuleInit,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Iyzipay from "iyzipay";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { IyzicoService } from "../integrations/iyzico/iyzico.service";
import { MetaCapiService } from "../integrations/meta/meta-capi.service";
import { verifyPaymentNonce, paymentNonce } from "./payment-nonce";
import { MailService } from "../mail/mail.service";
import { LoyaltyService } from "../loyalty/loyalty.service";

interface AddressView {
  fullName?: string;
  phone?: string;
  city?: string;
  district?: string;
  fullAddress?: string;
  zipCode?: string;
}

@Injectable()
export class PaymentsService implements OnModuleInit {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    private prisma: PrismaService,
    private iyzico: IyzicoService,
    private config: ConfigService,
    private mail: MailService,
    private metaCapi: MetaCapiService,
    private loyalty: LoyaltyService,
  ) {}

  onModuleInit() {
    // GÜVENLİK AĞI: callback kaçan ("para çekildi ama işaretlenmedi") ödemeleri periyodik kurtar.
    // Başlangıçtan 30sn sonra bir kez + her 10 dk. Tek api instance'ı olduğundan setInterval yeterli.
    setTimeout(() => void this.reconcilePendingPayments().catch((e) => this.logger.error('reconcile bootstrap failed', e)), 30_000);
    setInterval(() => void this.reconcilePendingPayments().catch((e) => this.logger.error('reconcile interval failed', e)), 10 * 60_000).unref?.();
  }

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
    // GÜVENLİK: Kargo bedeli geçerli bir sayı olmalı (NaN/Infinity/negatif → iyzico reddeder veya
    // hesap manipülasyonuna kapı açar). DB bozukluğu veya migration hatası durumuna karşı defansif kontrol.
    if (!Number.isFinite(shippingKurus) || shippingKurus < 0) {
      throw new BadRequestException("Geçersiz kargo bedeli; ödeme başlatılamadı.");
    }
    const itemsNetKurus = Math.max(0, subtotalKurus - discountKurus);

    const productItems: Array<{ id: string; name: string; kurus: number; shipping?: boolean }> = [];
    let allocated = 0;
    order.items.forEach((it, idx) => {
      const lineKurus = Math.round(Number(it.lineTotal) * 100);
      const share = subtotalKurus > 0 ? Math.round((lineKurus * itemsNetKurus) / subtotalKurus) : lineKurus;
      productItems.push({
        id: String(it.productSlug ?? it.id ?? `item-${idx}`).slice(0, 60),
        name: String(it.productName ?? "Ürün").slice(0, 100),
        kurus: share,
      });
      allocated += share;
    });
    // Ürün kalemleri toplamını tam itemsNetKurus'a sabitle (oransal yuvarlama farkını son kaleme yedir).
    if (productItems.length) productItems[productItems.length - 1].kurus += itemsNetKurus - allocated;

    // iyzico 0/negatif fiyatlı kalemi reddeder (hata 5050). 0'lık kalemleri at — toplamı etkilemez.
    const raw = productItems.filter((r) => r.kurus > 0);
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
  /** iyzico identityNumber 11 haneli olmalı. Müşteri TC girmezse iyzico'nun "kimlik yok"
   *  yer tutucusu "11111111111" kullanılır — iyzico bunu ÖZEL kabul eder (doğrulamaz; 324ajans
   *  prod'da TC sormadan bununla çalışıyor). Checksum-GEÇERLİ sahte TC (örn. 11111111110) ise
   *  iyzico GERÇEK TC sanıp 3DS'te kart sahibiyle doğrular → eşleşmezse "genel hata". Bu yüzden
   *  yer tutucu 11111111111 OLMALI (eski "checksum-geçerli" fix ödemeyi bozmuştu). */
  private safeIdentity(tc?: string): string {
    return tc && /^\d{11}$/.test(tc) ? tc : "11111111111";
  }

  async initCheckout(
    orderId: string,
    nonce: string,
    clientIp?: string,
    identityNumber?: string,
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
    // Açık hesap (cari) siparişi kartla ödenmez — tutar cari hesaba borç olarak işlenmiştir; ödeme
    // /hesabim/cari-hesabim üzerinden yapılır. (Çift ödeme/çift tahsilat koruması.)
    if (order.paymentMethod === "cari") {
      throw new BadRequestException("Açık hesap siparişi kartla ödenmez; ödeme cari hesabınızdan yapılır.");
    }
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
        identityNumber: this.safeIdentity(identityNumber), // checkout'taki TC; yoksa checksum-geçerli yer tutucu
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
      this.logger.warn(`iyzico init başarısız order=${orderId}: kod=${res.errorCode ?? "-"} mesaj=${res.errorMessage ?? "-"}`);
      // İşlem limiti (iyzico 5008 vb.): "tekrar deneyin" YANILTICI — deneme asla başarmaz. Net,
      // eyleme dönük mesaj + havale/cari alternatifi ver (yüksek tutarlı B2B siparişleri için).
      const limitError =
        res.errorCode === "5008" || /limit|aşıl|tutar/i.test(res.errorMessage ?? "");
      if (limitError) {
        throw new BadRequestException(
          "Bu tutarda online kart ödemesi alınamadı (banka/iyzico işlem limiti). Havale/EFT ya da kurumsal cari hesap için bize ulaşın: 0324 433 33 51 (WhatsApp: 0531 900 41 02).",
        );
      }
      throw new ServiceUnavailableException("Ödeme başlatılamadı, lütfen tekrar deneyin.");
    }
    // Token'ı sakla — callback kaçarsa reconciliation bununla ödemeyi kurtarır.
    if (res.token) {
      await this.prisma.order
        .update({ where: { id: orderId }, data: { iyzicoCheckoutToken: res.token } })
        .catch(() => undefined);
    }
    return { paymentPageUrl: res.paymentPageUrl, checkoutFormContent: res.checkoutFormContent, token: res.token };
  }

  /**
   * "Ödeme Yap" tekrar denemesi — giriş yapmış kullanıcı KENDİ beklemede siparişi için ödemeyi
   * yeniden başlatır (müşteri checkout'ta ödemeyi tamamlamadıysa siparişlerim'den tekrar dener).
   * Sahiplik (userId) doğrulanır; nonce sunucuda üretilip initCheckout yeniden kullanılır (IDOR güvenli).
   */
  async retryCheckoutForOwner(orderId: string, userId: string, clientIp?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, userId: true, paymentStatus: true },
    });
    // Varlık/sahiplik sızdırma: yoksa veya kullanıcının değilse aynı "bulunamadı".
    if (!order || order.userId !== userId) throw new NotFoundException("Sipariş bulunamadı.");
    if (order.paymentStatus === "basarili") throw new BadRequestException("Bu sipariş zaten ödenmiş.");
    const secret = this.config.get<string>("JWT_SECRET") ?? "";
    return this.initCheckout(orderId, paymentNonce(secret, orderId), clientIp);
  }

  /** Cari (açık hesap) bakiyesi: borç(debit) − tahsilat(credit). Pozitif = müşteri borçlu. */
  private corporateBalance(userId: string): Promise<number> {
    return this.ledgerBalanceVia(this.prisma, userId);
  }

  /**
   * Verilen Prisma client VEYA transaction client üzerinden cari bakiye hesaplar.
   * Transaction içinde çağrıldığında bakiye, o transaction'ın görünümüyle (callback'te kilit
   * sonrası güncel haliyle) okunur → fazla-alacak yeniden-doğrulaması doğru bakiyeyi görür.
   */
  private async ledgerBalanceVia(
    client: Prisma.TransactionClient,
    userId: string,
  ): Promise<number> {
    const grouped = await client.corporateLedgerEntry.groupBy({
      by: ["kind"],
      where: { userId },
      _sum: { amount: true },
    });
    let debit = 0;
    let credit = 0;
    for (const g of grouped) {
      const v = Number(g._sum.amount ?? 0);
      if (g.kind === "debit") debit = v;
      else credit = v;
    }
    return Math.round((debit - credit) * 100) / 100;
  }

  /**
   * Giriş yapmış kurumsal müşteri cari borcunu online (kart) öder — serbest/kısmi tutar.
   * Akış: tutarı doğrula (>0, ≤ güncel bakiye) → CorporatePayment(pending) → iyzico checkout
   * (conversationId "caripay:<id>") → hosted ödeme sayfası. Başarılı callback bir credit
   * defter kaydı oluşturup bakiyeyi düşürür (handleCallback → handlePaydownCallback).
   */
  async initCorporatePaydown(
    userId: string,
    amount: number,
    clientIp?: string,
  ): Promise<{ paymentPageUrl?: string; checkoutFormContent?: string; token?: string }> {
    if (!this.iyzico.isConfigured()) {
      throw new ServiceUnavailableException("Ödeme sistemi şu an kullanılamıyor.");
    }
    const amt = Math.round(Number(amount) * 100) / 100;
    if (!Number.isFinite(amt) || amt <= 0) throw new BadRequestException("Geçersiz tutar.");

    const balance = await this.corporateBalance(userId);
    if (balance <= 0) throw new BadRequestException("Açık hesabınızda ödenecek borç bulunmuyor.");
    if (amt > balance) {
      throw new BadRequestException(`Ödeme tutarı borcunuzu (${balance} ₺) aşamaz.`);
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fullName: true, phone: true, companyName: true },
    });
    if (!user) throw new NotFoundException("Kullanıcı bulunamadı.");

    const payment = await this.prisma.corporatePayment.create({
      data: { userId, amount: new Prisma.Decimal(amt), status: "pending", description: "Online cari ödeme" },
    });

    const { name, surname } = this.splitName(user.fullName ?? user.email);
    const apiBase = this.config.get<string>("API_PUBLIC_URL") ?? "http://localhost:4000";
    const callbackUrl = `${apiBase}/api/payments/iyzico/callback`;
    const price = amt.toFixed(2);
    const contact = user.companyName || user.fullName || "Kurumsal müşteri";

    const request: Record<string, unknown> = {
      locale: Iyzipay.LOCALE.TR,
      // "caripay:" öneki callback'te paydown dalını tetikler (sipariş değil).
      conversationId: `caripay:${payment.id}`,
      price,
      paidPrice: price,
      currency: Iyzipay.CURRENCY.TRY,
      basketId: `CARI-${payment.id}`,
      paymentGroup: Iyzipay.PAYMENT_GROUP.PRODUCT,
      callbackUrl,
      enabledInstallments: [1],
      buyer: {
        id: user.id,
        name,
        surname,
        gsmNumber: this.gsm(user.phone ?? undefined),
        email: user.email,
        identityNumber: this.safeIdentity(undefined),
        registrationAddress: contact,
        ip: clientIp || "0.0.0.0",
        city: "Bilinmiyor",
        country: "Turkey",
      },
      shippingAddress: { contactName: contact, city: "Bilinmiyor", country: "Turkey", address: "Cari hesap ödemesi" },
      billingAddress: { contactName: contact, city: "Bilinmiyor", country: "Turkey", address: "Cari hesap ödemesi" },
      basketItems: [
        {
          id: `cari-${payment.id}`.slice(0, 60),
          name: "Cari Hesap Ödemesi",
          category1: "Ödeme",
          itemType: Iyzipay.BASKET_ITEM_TYPE.VIRTUAL,
          price,
        },
      ],
    };

    const res = await this.iyzico.initializeCheckoutForm(request);
    if (res.status !== "success") {
      this.logger.warn(`iyzico cari paydown init başarısız user=${userId}: ${res.errorMessage}`);
      await this.prisma.corporatePayment
        .update({ where: { id: payment.id }, data: { status: "failed" } })
        .catch(() => undefined);
      throw new ServiceUnavailableException("Ödeme başlatılamadı, lütfen tekrar deneyin.");
    }
    if (res.token) {
      await this.prisma.corporatePayment
        .update({ where: { id: payment.id }, data: { iyzicoToken: res.token } })
        .catch(() => undefined);
    }
    return { paymentPageUrl: res.paymentPageUrl, checkoutFormContent: res.checkoutFormContent, token: res.token };
  }

  /**
   * Cari paydown callback'i — sipariş değil, panelden yapılan online cari ödemesi.
   * Tutar/sepet bütünlüğü doğrulanır; başarılıysa ATOMİK olarak ödeme "paid" işaretlenip
   * tek bir credit defter kaydı oluşturulur (updateMany guard → çift callback'te çift-alacak yok).
   */
  private async handlePaydownCallback(
    paymentId: string,
    result: { status?: string; price?: string | number; basketId?: string; paymentId?: string },
    webOrigin: string,
  ): Promise<{ redirectUrl: string }> {
    const ok = `${webOrigin}/hesabim/cari-hesabim?odeme=basarili`;
    const err = `${webOrigin}/hesabim/cari-hesabim?odeme=hata`;
    const payment = await this.prisma.corporatePayment.findUnique({ where: { id: paymentId } });
    if (!payment) {
      this.logger.warn(`cari paydown callback: kayıt bulunamadı payment=${paymentId}`);
      return { redirectUrl: err };
    }

    const priceKurus = Math.round(Number(result.price) * 100);
    const expectedKurus = Math.round(Number(payment.amount) * 100);
    const amountOk = Number.isFinite(priceKurus) && priceKurus === expectedKurus;
    const basketOk = result.basketId === `CARI-${payment.id}`;

    if (result.status === "success") {
      if (!amountOk || !basketOk) {
        this.logger.error(
          `cari paydown DOĞRULAMA UYUŞMAZLIĞI payment=${paymentId} price=${result.price} beklenen=${payment.amount} basket=${result.basketId}`,
        );
        return { redirectUrl: err };
      }
      // ATOMİK + IDEMPOTENT + YENİDEN-DOĞRULAMALI tahsilat işlemesi.
      // (a) Idempotency/çift-callback: claim (updateMany status≠paid) ile credit kaydı oluşturma
      //     AYNI transaction'da → iki eşzamanlı/yinelenen callback yalnız BİR credit kaydı üretir.
      // (b) Yeniden-doğrulama: init'te bakiye doğrulandı ancak init↔callback arasında admin manuel
      //     tahsilat girebilir → fazla-alacak (negatif bakiye) riski. Callback'te güncel bakiyeyi
      //     transaction içinde yeniden okuyup tahsilatı bakiyeyle KIRPARIZ (clamp), böylece bakiye
      //     0'ın altına inmez. Meşru tam ödeme (amount ≤ bakiye) aynen geçer.
      const credited = await this.prisma.$transaction(async (tx) => {
        // Atomik claim: yalnız henüz 'paid' olmayan kayıt güncellenir → tek callback kazanır.
        const claim = await tx.corporatePayment.updateMany({
          where: { id: payment.id, status: { not: "paid" } },
          data: { status: "paid", paidAt: new Date(), iyzicoPaymentId: result.paymentId ?? undefined },
        });
        if (claim.count === 0) return null; // başka callback zaten işledi → idempotent no-op

        // Güncel bakiyeyi transaction içinden yeniden hesapla (admin manuel tahsilatı dahil).
        const balance = await this.ledgerBalanceVia(tx, payment.userId);
        const requested = Number(payment.amount);
        // Fazla-alacağı engelle: bakiye kalanından fazlasını alacaklandırma (clamp ≥ 0).
        const creditAmount = Math.round(Math.min(requested, Math.max(0, balance)) * 100) / 100;
        if (creditAmount <= 0) {
          this.logger.warn(
            `cari paydown: borç kapanmış, alacak kaydı atlandı payment=${paymentId} user=${payment.userId} bakiye=${balance} talep=${requested}`,
          );
          return 0;
        }
        await tx.corporateLedgerEntry.create({
          data: {
            userId: payment.userId,
            kind: "credit",
            amount: new Prisma.Decimal(creditAmount),
            description: "Online cari ödeme (kart)",
          },
        });
        return creditAmount;
      });
      if (credited && credited > 0) {
        this.logger.log(`cari paydown BAŞARILI payment=${paymentId} user=${payment.userId} tutar=${credited}`);
      }
      return { redirectUrl: ok };
    }

    if (payment.status === "pending") {
      await this.prisma.corporatePayment
        .update({ where: { id: payment.id }, data: { status: "failed" } })
        .catch(() => undefined);
    }
    this.logger.warn(`cari paydown BAŞARISIZ payment=${paymentId}`);
    return { redirectUrl: err };
  }

  /**
   * GÜVENLİK AĞI — callback kaçan ödemeleri kurtarır. Son 48 saatte 'beklemede' kalan,
   * iyzico token'ı olan siparişleri retrieve eder; iyzico'da BAŞARILI ve tutar/sepet eşleşiyorsa
   * siparişi 'basarili' işaretler. Böylece "para çekildi ama sipariş işaretlenmedi" kalıcı olmaz.
   */
  async reconcilePendingPayments(): Promise<{ checked: number; recovered: number }> {
    if (!this.iyzico.isConfigured()) return { checked: 0, recovered: 0 };
    const since = new Date(Date.now() - 48 * 3600_000);
    const pending = await this.prisma.order.findMany({
      where: {
        paymentStatus: "beklemede",
        iyzicoCheckoutToken: { not: null },
        createdAt: { gte: since },
        deletedAt: null,
      },
      select: { id: true, orderNumber: true, total: true, iyzicoCheckoutToken: true },
      take: 100,
    });
    let recovered = 0;
    for (const o of pending) {
      try {
        const result = await this.iyzico.retrieveCheckoutForm(o.iyzicoCheckoutToken as string, o.id);
        if (result.status !== "success") continue;
        const basketOk = result.basketId === o.orderNumber;
        const priceKurus = Math.round(Number(result.price) * 100);
        const expectedKurus = Math.round(Number(o.total) * 100);
        if (!basketOk || priceKurus !== expectedKurus) {
          this.logger.error(
            `reconcile UYUŞMAZLIK order=${o.id} basket=${result.basketId}/${o.orderNumber} price=${result.price}/${o.total} → atlandı`,
          );
          continue;
        }
        // IDEMPOTENT kurtarma: koşullu updateMany (yalnız hâlâ "beklemede") → bu sipariş için
        // gerçek callback findMany ile bu update arasında çoktan "basarili" yaptıysa reconcile
        // onu yeniden işlemez (count=0). Çift-işleme/yarış kapatılır.
        const claimed = await this.prisma.order.updateMany({
          where: { id: o.id, paymentStatus: "beklemede" },
          data: { paymentStatus: "basarili", iyzicoPaymentId: result.paymentId ?? undefined, iyzicoConversationId: o.id },
        });
        if (claimed.count === 0) continue; // callback zaten işlemişti → no-op
        recovered++;
        // Callback kaçtığında handleCallback'teki bildirimler de kaçıyordu: müşteri onay maili
        // ALMIYOR ("param gitti mi?") ve Meta Purchase dönüşümü kaybediliyordu. Kurtarmada da
        // (yalnız count>0 = ilk işaretleme) fire-and-forget olarak tetikle.
        void this.mail.sendOrderConfirmationEmail(o.id).catch(() => undefined);
        void this.metaCapi.sendPurchase(o.id).catch(() => undefined);
        // Sadakat kazanımı (idempotent + best-effort) — callback kaçmış siparişte de kazanım kaybolmasın.
        void this.loyalty.earnForOrder(o.id).catch(() => undefined);
        this.logger.warn(`reconcile: KURTARILDI order=${o.id} payment=${result.paymentId} (callback kaçmıştı) → mail+CAPI tetiklendi`);
      } catch (e) {
        /* tek sipariş hatası tüm taramayı bozmasın — ama logla */
        this.logger.error(`reconcile HATA order=${o.id} orderNumber=${o.orderNumber}: ${(e as Error).message ?? e}`);
      }
    }
    if (recovered) this.logger.warn(`reconcile tamam: ${recovered}/${pending.length} sipariş kurtarıldı`);
    return { checked: pending.length, recovered };
  }

  /**
   * iyzico callback'i: token ile sonucu doğrular, sipariş paymentStatus'unu günceller,
   * tarayıcının yönlendirileceği web URL'ini döndürür. Token'a güvenmez — sonuç iyzico'dan
   * `retrieve` ile çekilir (sahte callback POST'u retrieve'de başarısız olur).
   */
  async handleCallback(token: string): Promise<{ redirectUrl: string }> {
    const webOrigin = (this.config.get<string>("WEB_ORIGIN") ?? "http://localhost:3000").split(",")[0];
    this.logger.log(`iyzico callback geldi: token=${token ? "var" : "YOK"}`);
    if (!token) {
      this.logger.warn("iyzico callback: token YOK (body parse?) → /odeme/hata");
      return { redirectUrl: `${webOrigin}/odeme/hata` };
    }

    const result = await this.iyzico.retrieveCheckoutForm(token);
    this.logger.log(
      `iyzico retrieve: status=${result.status} paymentStatus=${result.paymentStatus} conv=${result.conversationId} ` +
        `price=${result.price} paid=${result.paidPrice} basket=${result.basketId} kod=${result.errorCode ?? "-"} mesaj=${result.errorMessage ?? "-"}`,
    );
    const conversationId = result.conversationId;

    // Cari hesap ödemesi (paydown) — sipariş değil. conversationId "caripay:<paymentId>".
    if (conversationId?.startsWith("caripay:")) {
      return this.handlePaydownCallback(conversationId.slice("caripay:".length), result, webOrigin);
    }
    // conversationId BOŞ dönebiliyor (iyzico) → basketId "CARI-<paymentId>" ile cari paydown'ı çöz.
    // Sipariş yolundaki basketId fallback'inin cari karşılığı; boş-conversationId'de kredi kaybını önler.
    if (!conversationId && result.basketId?.startsWith("CARI-")) {
      return this.handlePaydownCallback(result.basketId.slice("CARI-".length), result, webOrigin);
    }

    // Sipariş ödemesi: normalde conversationId = order.id. ANCAK iyzico checkoutForm.retrieve
    // conversationId'yi BOŞ döndürebiliyor → bu durumda basketId (= order.orderNumber) ile çöz.
    // Aksi halde iyzico kartı çekmişken sipariş "beklemede" kalır (para çekildi, işaretlenmedi).
    const order = conversationId
      ? await this.prisma.order.findUnique({
          where: { id: conversationId },
          select: { id: true, paymentStatus: true, orderNumber: true, total: true },
        })
      : result.basketId
        ? await this.prisma.order.findFirst({
            where: { orderNumber: result.basketId },
            select: { id: true, paymentStatus: true, orderNumber: true, total: true },
          })
        : null;
    if (!order) {
      this.logger.warn(
        `iyzico callback: sipariş bulunamadı conv=${conversationId ?? "-"} basket=${result.basketId ?? "-"} → /odeme/hata`,
      );
      return { redirectUrl: `${webOrigin}/odeme/hata` };
    }
    const orderId = order.id;

    // Callback özgünlüğü: kayıt bu siparişe ait (basketId=orderNumber) ve tutar BEKLENEN ile aynı mı?
    // ÖNEMLİ: iyzico `price` = sepet toplamı (bizim gönderdiğimiz). `paidPrice` TAKSİT komisyonuyla
    // price'tan YÜKSEK olabilir → bütünlük kontrolü `price` ile yapılır (yoksa taksitli ödeme reddedilip
    // para çekilmiş ama sipariş işaretlenmemiş kalırdı).
    const basketOk = result.basketId === order.orderNumber;
    const priceKurus = Math.round(Number(result.price) * 100);
    const expectedKurus = Math.round(Number(order.total) * 100);
    const amountOk = Number.isFinite(priceKurus) && priceKurus === expectedKurus;

    if (result.status === "success") {
      if (!basketOk || !amountOk) {
        this.logger.error(
          `iyzico DOĞRULAMA UYUŞMAZLIĞI order=${orderId} basketId=${result.basketId} beklenen=${order.orderNumber} ` +
            `price=${result.price} beklenenTutar=${order.total} → ödeme işaretlenmedi, MANUEL İNCELEME`,
        );
        return { redirectUrl: `${webOrigin}/odeme/hata?siparis=${orderId}` };
      }
      // IDEMPOTENT işaretleme: koşullu updateMany ile yalnız HÂLÂ "basarili" OLMAYAN sipariş
      // güncellenir → iki eşzamanlı/yinelenen iyzico callback'i (retry/dup POST) lost-update
      // anomalisine yol açmaz; ilk yazım kazanır, ikincisi count=0 ile sessiz no-op olur.
      const upd = await this.prisma.order.updateMany({
        where: { id: orderId, paymentStatus: { not: "basarili" } },
        data: {
          paymentStatus: "basarili",
          iyzicoPaymentId: result.paymentId ?? undefined,
          iyzicoConversationId: orderId,
        },
      });
      // Yalnız İLK başarı işaretlemesinde (count>0) MÜŞTERİYE onay maili → yinelenen
      // callback'lerde çift mail gitmez. Fire-and-forget: redirect'i geciktirmez, akışı bloke etmez.
      if (upd.count > 0) {
        void this.mail.sendOrderConfirmationEmail(orderId).catch(() => undefined);
        // Meta Conversions API: sunucu-taraflı Purchase (KVKK onay-gate'li, event_id=orderNumber
        // ile tarayıcı Pixel'ine dedup). Fire-and-forget: redirect'i geciktirmez, akışı bloke etmez.
        void this.metaCapi.sendPurchase(orderId).catch(() => undefined);
        // Sadakat kazanımı (LOYALTY_ENABLED açıksa; idempotent + best-effort). Akışı bloke etmez.
        void this.loyalty.earnForOrder(orderId).catch(() => undefined);
      }
      this.logger.log(
        `iyzico ödeme BAŞARILI order=${orderId} payment=${result.paymentId} price=${result.price} paid=${result.paidPrice}`,
      );
      return { redirectUrl: `${webOrigin}/odeme/basarili/${orderId}` };
    }

    // Başarısız: yalnız hâlâ beklemede VE bu siparişe ait callback ise işaretle (griefing/çapraz koruması).
    // Koşullu updateMany: where'e paymentStatus="beklemede" eklenir → eşzamanlı bir başarı callback'i
    // siparişi "basarili" yaptıysa, geç gelen başarısızlık onu EZEMEZ (count=0, no-op).
    if (basketOk) {
      await this.prisma.order.updateMany({
        where: { id: orderId, paymentStatus: "beklemede" },
        data: { paymentStatus: "basarisiz" },
      });
    }
    this.logger.warn(
      `iyzico ödeme BAŞARISIZ order=${orderId}: status=${result.paymentStatus} kod=${result.errorCode ?? "-"} mesaj=${result.errorMessage ?? "-"}`,
    );
    return { redirectUrl: `${webOrigin}/odeme/hata?siparis=${orderId}` };
  }
}
