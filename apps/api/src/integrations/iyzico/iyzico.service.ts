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
}
