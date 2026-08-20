import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import Iyzipay from "iyzipay";

/**
 * iyzico ödeme entegrasyonu — GERÇEK (Checkout Form / hosted).
 *
 * Akış: kart bilgisi MARKALA sitesine GİRİLMEZ — müşteri iyzico'nun barındırdığı
 * ödeme sayfasında (paymentPageUrl) kartını girer, 3D Secure iyzico tarafında yapılır.
 * Böylece PCI kapsamı minimumda kalır. iyzico ödeme sonucunu callbackUrl'e POST eder;
 * sonucu token ile `retrieve` ederek doğrularız.
 *
 * Config eksikse servis no-op (isConfigured=false) — ödeme akışı 503 döner, başka yer bozulmaz.
 * ENV: IYZICO_API_KEY, IYZICO_SECRET, IYZICO_BASE_URL (varsayılan sandbox). Docs: docs.iyzico.com
 */

export interface IyzicoInitResult {
  status: "success" | "failure";
  token?: string;
  checkoutFormContent?: string;
  paymentPageUrl?: string;
  errorCode?: string;
  errorMessage?: string;
}

export interface IyzicoRetrieveResult {
  /** iyzico ham durumu: SUCCESS | FAILURE | INIT_THREEDS | CALLBACK_THREEDS ... */
  paymentStatus: string;
  /** Bizim sadeleştirilmiş kararımız. */
  status: "success" | "failure";
  paymentId?: string;
  conversationId?: string;
  basketId?: string;
  /** Sepet toplamı (taksit komisyonu HARİÇ) — bizim gönderdiğimiz tutar; doğrulama buna göre. */
  price?: string;
  /** Müşterinin gerçekte ödediği (taksit komisyonu DAHİL olabilir, price'tan yüksek). */
  paidPrice?: string;
  errorCode?: string;
  errorMessage?: string;
}

@Injectable()
export class IyzicoService {
  private readonly logger = new Logger(IyzicoService.name);
  private client: Iyzipay | null = null;

  constructor(private config: ConfigService) {}

  /** Tüm zorunlu env var mı? Yoksa ödeme servisi no-op. */
  isConfigured(): boolean {
    return Boolean(this.config.get<string>("IYZICO_API_KEY") && this.config.get<string>("IYZICO_SECRET"));
  }

  private get baseUrl(): string {
    // Güvenli varsayılan: sandbox. Prod'da IYZICO_BASE_URL=https://api.iyzipay.com verilmeli.
    return this.config.get<string>("IYZICO_BASE_URL") ?? "https://sandbox-api.iyzipay.com";
  }

  private getClient(): Iyzipay {
    if (this.client) return this.client;
    this.client = new Iyzipay({
      apiKey: this.config.get<string>("IYZICO_API_KEY") ?? "",
      secretKey: this.config.get<string>("IYZICO_SECRET") ?? "",
      uri: this.baseUrl,
    });
    return this.client;
  }

  /** Checkout Form başlat — paymentPageUrl (yönlendirme) + checkoutFormContent (popup) döner. */
  async initializeCheckoutForm(request: Record<string, unknown>): Promise<IyzicoInitResult> {
    const client = this.getClient();
    return new Promise<IyzicoInitResult>((resolve) => {
      client.checkoutFormInitialize.create(request, (err, result) => {
        if (err) {
          this.logger.error(`iyzico init hata: ${(err as Error)?.message ?? String(err)}`);
          resolve({ status: "failure", errorMessage: "init_error" });
          return;
        }
        if (result?.status !== "success") {
          // errorMessage müşteriye gösterilebilir genel bir mesaj; kart/PII içermez.
          // errorCode de taşınır → çağıran limit hatasını (5008) net mesaja çevirebilir.
          this.logger.warn(`iyzico init başarısız: ${result?.errorCode} ${result?.errorMessage}`);
          resolve({ status: "failure", errorCode: result?.errorCode, errorMessage: result?.errorMessage });
          return;
        }
        resolve({
          status: "success",
          token: result.token,
          checkoutFormContent: result.checkoutFormContent,
          paymentPageUrl: result.paymentPageUrl,
        });
      });
    });
  }

  /** Ödeme sonucunu token ile doğrula (callback'te çağrılır). */
  async retrieveCheckoutForm(token: string, conversationId?: string): Promise<IyzicoRetrieveResult> {
    const client = this.getClient();
    return new Promise<IyzicoRetrieveResult>((resolve) => {
      client.checkoutForm.retrieve(
        { locale: Iyzipay.LOCALE.TR, conversationId: conversationId ?? "", token },
        (err, result) => {
          if (err) {
            this.logger.error(`iyzico retrieve hata: ${(err as Error)?.message ?? String(err)}`);
            resolve({ paymentStatus: "ERROR", status: "failure", errorMessage: "retrieve_error" });
            return;
          }
          const ok = result?.status === "success" && result?.paymentStatus === "SUCCESS";
          resolve({
            paymentStatus: result?.paymentStatus ?? "FAILURE",
            status: ok ? "success" : "failure",
            paymentId: result?.paymentId,
            conversationId: result?.conversationId,
            basketId: result?.basketId,
            price: result?.price,
            paidPrice: result?.paidPrice,
            errorCode: result?.errorCode,
            errorMessage: result?.errorMessage,
          });
        },
      );
    });
  }

  /**
   * Ödemenin TAMAMINI müşteriye geri döndürür. 2026-08-20 (Hasan talebi: panelden iade butonu).
   *
   * iyzico'da iki ayrı işlem var ve hangisinin geçerli olduğu ZAMANA bağlı:
   *   - cancel : yalnız gün sonu kapanışından ÖNCE (pratikte aynı gün), TAM tutar, paymentId yeterli
   *   - refund : kapanış SONRASI, kalem (paymentTransactionId) bazında çalışır
   * Panelden iade çoğunlukla ertesi gün+ yapıldığı için ikisini de deniyoruz: önce cancel,
   * başarısızsa ödeme detayını çekip her kalem için refund.
   *
   * Elimizde yalnız iyzicoPaymentId var (paymentTransactionId saklanmıyor); bu yüzden refund
   * yolunda önce payment.retrieve ile itemTransactions alınır.
   */
  async refundPaymentFully(input: {
    paymentId: string;
    conversationId?: string;
    ip?: string;
  }): Promise<{ ok: boolean; method?: "cancel" | "refund"; refunded?: number; error?: string }> {
    if (!this.isConfigured()) return { ok: false, error: "iyzico_yapilandirilmamis" };
    const client = this.getClient();
    const locale = Iyzipay.LOCALE.TR;
    const conversationId = input.conversationId ?? "";
    const ip = input.ip && input.ip.length > 0 ? input.ip : "127.0.0.1";

    // 1) Aynı gün ise iptal en temizi: tek çağrı, tam tutar.
    const cancelRes = await new Promise<{ ok: boolean; msg?: string }>((resolve) => {
      client.cancel.create({ locale, conversationId, paymentId: input.paymentId, ip }, (err, result) => {
        if (err) return resolve({ ok: false, msg: (err as Error)?.message ?? String(err) });
        resolve({ ok: result?.status === "success", msg: result?.errorMessage ?? result?.errorCode });
      });
    });
    if (cancelRes.ok) {
      this.logger.log(`iyzico iptal (cancel) başarılı payment=${input.paymentId}`);
      return { ok: true, method: "cancel" };
    }
    this.logger.warn(`iyzico cancel başarısız (kapanış geçmiş olabilir) payment=${input.paymentId}: ${cancelRes.msg}`);

    // 2) Kapanış geçmiş → kalem bazlı iade. Önce işlem kimliklerini al.
    const detail = await new Promise<{ items: Array<{ id: string; paidPrice: string }>; error?: string }>((resolve) => {
      client.payment.retrieve({ locale, conversationId, paymentId: input.paymentId }, (err, result) => {
        if (err) return resolve({ items: [], error: (err as Error)?.message ?? String(err) });
        if (result?.status !== "success") return resolve({ items: [], error: result?.errorMessage ?? "retrieve_failure" });
        const items = (result?.itemTransactions ?? []).map((t: { paymentTransactionId: string; paidPrice: unknown }) => ({
          id: String(t.paymentTransactionId),
          paidPrice: String(t.paidPrice),
        }));
        resolve({ items });
      });
    });
    if (detail.items.length === 0) {
      return { ok: false, error: detail.error ?? "iade_edilecek_kalem_bulunamadi" };
    }

    // Her kalem ayrı iade edilir; BİRİ bile başarısızsa kısmi iade oluşur — bu durumu
    // çağırana bildiriyoruz ki panelde "kısmen iade edildi" olarak ele alınabilsin.
    let refunded = 0;
    const errors: string[] = [];
    for (const it of detail.items) {
      const r = await new Promise<{ ok: boolean; msg?: string }>((resolve) => {
        client.refund.create(
          { locale, conversationId, paymentTransactionId: it.id, price: it.paidPrice, ip, currency: Iyzipay.CURRENCY.TRY },
          (err, result) => {
            if (err) return resolve({ ok: false, msg: (err as Error)?.message ?? String(err) });
            resolve({ ok: result?.status === "success", msg: result?.errorMessage ?? result?.errorCode });
          },
        );
      });
      if (r.ok) refunded += Number(it.paidPrice) || 0;
      else errors.push(`${it.id}: ${r.msg ?? "bilinmeyen"}`);
    }

    if (errors.length > 0) {
      this.logger.error(`iyzico iade KISMİ/BAŞARISIZ payment=${input.paymentId}: ${errors.join(" | ")}`);
      return { ok: refunded > 0, method: "refund", refunded, error: errors.join(" | ") };
    }
    this.logger.log(`iyzico iade başarılı payment=${input.paymentId} tutar=${refunded}`);
    return { ok: true, method: "refund", refunded };
  }
}
