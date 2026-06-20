import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PrismaService } from "../../prisma/prisma.service";

/**
 * Paraşüt e-Fatura/e-Arşiv entegrasyonu — GERÇEK (API v4, JSON:API).
 *
 * Akış:
 *  1. OAuth2 password grant ile access_token al (in-memory cache + refresh).
 *  2. Sipariş ödendiğinde: müşteriyi (contact) upsert et → sales_invoice oluştur.
 *  3. Bireysel (billing type=individual) → e-Arşiv; Kurumsal (taxNumber'lı) → e-Fatura adayı.
 *
 * ENV (VPS /opt/markala/.env.production):
 *  PARASUT_CLIENT_ID, PARASUT_CLIENT_SECRET  (Hasan verdi — gh secrets'ta da var)
 *  PARASUT_USERNAME, PARASUT_PASSWORD        (Paraşüt hesap e-posta/şifre — password grant)
 *  PARASUT_COMPANY_ID                        (Markala'nın Paraşüt firma id — Lisan Fen ref: 427609)
 *
 * Config eksikse servis sessizce no-op döner (sipariş akışını bozmaz). Docs: apidocs.parasut.com
 */
@Injectable()
export class ParasutService {
  private readonly logger = new Logger(ParasutService.name);
  private readonly oauthUrl = "https://api.parasut.com/oauth/token";
  private readonly redirectUri = "urn:ietf:wg:oauth:2.0:oob";
  private token: { access: string; refresh: string; expiresAt: number } | null = null;
  /** Ürün adı → Paraşüt product id (instance içi cache, tekrar aramayı önler). */
  private productCache = new Map<string, string>();

  constructor(private config: ConfigService, private prisma: PrismaService) {}

  private cfg(k: string): string | undefined {
    return this.config.get<string>(k);
  }
  private get companyId(): string | undefined {
    return this.cfg("PARASUT_COMPANY_ID");
  }
  private get apiBase(): string {
    return `https://api.parasut.com/v4/${this.companyId}`;
  }
  /** Tüm zorunlu env var mı? Yoksa servis no-op. */
  isConfigured(): boolean {
    return Boolean(
      this.cfg("PARASUT_CLIENT_ID") && this.cfg("PARASUT_CLIENT_SECRET") &&
      this.cfg("PARASUT_USERNAME") && this.cfg("PARASUT_PASSWORD") && this.companyId,
    );
  }

  // === OAuth2 ===
  private async getAccessToken(): Promise<string> {
    const now = Date.now();
    if (this.token && this.token.expiresAt - 60_000 > now) return this.token.access;

    const grant = this.token
      ? { grant_type: "refresh_token", refresh_token: this.token.refresh }
      : { grant_type: "password", username: this.cfg("PARASUT_USERNAME"), password: this.cfg("PARASUT_PASSWORD") };

    const res = await fetch(this.oauthUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...grant,
        client_id: this.cfg("PARASUT_CLIENT_ID"),
        client_secret: this.cfg("PARASUT_CLIENT_SECRET"),
        redirect_uri: this.redirectUri,
      }),
    });
    if (!res.ok) {
      this.token = null; // refresh başarısızsa bir sonraki sefer password grant'a düş
      // Ham gövdeyi Error'a KOYMA (token/PII sızabilir) — yalnız debug'da ayrı logla.
      this.logger.debug(`Paraşüt OAuth hata gövdesi: ${(await res.text()).slice(0, 200)}`);
      throw new Error(`Paraşüt OAuth ${res.status}`);
    }
    const j = (await res.json()) as { access_token: string; refresh_token: string; expires_in: number };
    this.token = { access: j.access_token, refresh: j.refresh_token, expiresAt: now + j.expires_in * 1000 };
    return this.token.access;
  }

  /** v4 JSON:API çağrısı. */
  private async api<T = any>(method: string, path: string, body?: unknown): Promise<T> {
    const token = await this.getAccessToken();
    const res = await fetch(`${this.apiBase}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    const text = await res.text();
    if (!res.ok) {
      // Ham yanıt gövdesini Error mesajına KOYMA (logger.error'a sızmasın) — debug'da ayrı tut.
      this.logger.debug(`Paraşüt API hata gövdesi (${method} ${path}): ${text.slice(0, 300)}`);
      throw new Error(`Paraşüt ${method} ${path} → ${res.status}`);
    }
    return (text ? JSON.parse(text) : {}) as T;
  }

  // === Contact (müşteri) upsert ===
  async upsertContact(input: {
    email: string;
    fullName: string;
    accountType: "individual" | "corporate";
    taxNumber?: string;
    taxOffice?: string;
    phone?: string;
    address?: string;
    city?: string;
    district?: string;
  }): Promise<{ contactId: string }> {
    if (!this.isConfigured()) {
      this.logger.warn(`[Paraşüt yapılandırılmamış] contact upsert atlandı: ${input.email}`);
      return { contactId: "" };
    }
    const found = await this.api<{ data: Array<{ id: string }> }>(
      "GET",
      `/contacts?filter[email]=${encodeURIComponent(input.email)}&page[size]=1`,
    );
    if (found.data?.[0]?.id) return { contactId: found.data[0].id };

    const created = await this.api<{ data: { id: string } }>("POST", "/contacts", {
      data: {
        type: "contacts",
        attributes: {
          name: input.fullName,
          email: input.email,
          contact_type: input.accountType === "corporate" ? "company" : "person",
          tax_number: input.taxNumber ?? undefined,
          tax_office: input.taxOffice ?? undefined,
          phone: input.phone ?? undefined,
          city: input.city ?? undefined,
          district: input.district ?? undefined,
          address: input.address ?? undefined,
          account_type: "customer",
        },
      },
    });
    return { contactId: created.data.id };
  }

  // === Ürün (product) upsert — fatura kalemi zorunlu product ilişkisi için ===
  /** Ürün adına göre Paraşüt product'ı bulur, yoksa oluşturur. ID döner. */
  private async upsertProduct(name: string, listPrice: number, vatRate: number): Promise<string> {
    const key = name.slice(0, 250);
    const cached = this.productCache.get(key);
    if (cached) return cached;

    const found = await this.api<{ data: Array<{ id: string; attributes: { name: string } }> }>(
      "GET",
      `/products?filter[name]=${encodeURIComponent(key)}&page[size]=5`,
    );
    const exact = found.data?.find((p) => p.attributes?.name === key);
    if (exact?.id) {
      this.productCache.set(key, exact.id);
      return exact.id;
    }

    const created = await this.api<{ data: { id: string } }>("POST", "/products", {
      data: {
        type: "products",
        attributes: { name: key, vat_rate: vatRate, list_price: listPrice, currency: "TRL" },
      },
    });
    this.productCache.set(key, created.data.id);
    return created.data.id;
  }

  // === Sipariş → sales_invoice ===
  async createInvoiceFromOrder(orderId: string): Promise<{ invoiceId: string; status: "issued" | "queued" | "failed" | "skipped" }> {
    if (!this.isConfigured()) {
      this.logger.warn(`[Paraşüt yapılandırılmamış] sipariş ${orderId} için fatura atlandı.`);
      return { invoiceId: "", status: "skipped" };
    }
    try {
      const order = await this.prisma.order.findUnique({
        where: { id: orderId },
        include: { items: true, billingAddress: true },
      });
      if (!order) return { invoiceId: "", status: "failed" };

      const bill: any = order.billingAddress ?? (order.billingAddressSnapshot as any) ?? {};
      const isCorporate = Boolean(bill?.type === "corporate" && bill?.taxNumber);

      const { contactId } = await this.upsertContact({
        email: order.email,
        fullName: bill?.fullName ?? order.email,
        accountType: isCorporate ? "corporate" : "individual",
        taxNumber: bill?.taxNumber,
        taxOffice: bill?.taxOffice,
        phone: order.phone,
        address: bill?.fullAddress,
        city: bill?.city,
        district: bill?.district,
      });
      if (!contactId) return { invoiceId: "", status: "failed" };

      // KDV %20. Sistem fiyatları KDV DAHİL saklandığından Paraşüt'e NET (KDV hariç) gönderilir;
      // aksi halde Paraşüt net'in üstüne %20 ekleyip faturayı %20 fazla keserdi.
      const vatRate = 20;
      const grossToNet = (gross: number) => Math.round((gross / (1 + vatRate / 100)) * 100) / 100;

      // Kupon indirimi (order.discount, KDV dahil TL) ürün satırlarına oransal YÜZDE olarak dağıtılır
      // → Paraşüt'ün hesapladığı toplam, müşterinin ödediği order.total ile eşleşir. (Kargoya uygulanmaz.)
      const subtotalGross = order.items.reduce((s, it) => s + Number(it.unitPrice) * it.quantity, 0);
      const discountGross = Number(order.discount ?? 0);
      const discountPct =
        subtotalGross > 0 && discountGross > 0
          ? Math.round((discountGross / subtotalGross) * 10000) / 100 // iki ondalık yüzde
          : 0;

      // Her kalem bir Paraşüt product'ına bağlı olmalı → ürün adına göre upsert.
      const details: Array<Record<string, unknown>> = [];
      for (const it of order.items) {
        const netUnit = grossToNet(Number(it.unitPrice));
        const productId = await this.upsertProduct(it.productName, netUnit, vatRate);
        details.push({
          type: "sales_invoice_details",
          attributes: {
            quantity: it.quantity,
            unit_price: netUnit,
            vat_rate: vatRate,
            description: `${it.productName} — ${it.configurationSummary}`.slice(0, 250),
            ...(discountPct > 0 ? { discount_type: "percentage", discount_value: discountPct } : {}),
          },
          relationships: {
            product: { data: { type: "products", id: productId } },
          },
        });
      }

      // Kargo bedeli ayrı kalem. Ücretsiz kargo/kupon ile 0 ise atlanır.
      const shippingGross = Number(order.shippingFee ?? 0);
      if (shippingGross > 0) {
        const netShip = grossToNet(shippingGross);
        const shipProductId = await this.upsertProduct("Kargo", netShip, vatRate);
        details.push({
          type: "sales_invoice_details",
          attributes: {
            quantity: 1,
            unit_price: netShip,
            vat_rate: vatRate,
            description: "Kargo bedeli",
          },
          relationships: {
            product: { data: { type: "products", id: shipProductId } },
          },
        });
      }

      const today = new Date().toISOString().slice(0, 10);
      const created = await this.api<{ data: { id: string } }>("POST", "/sales_invoices", {
        data: {
          type: "sales_invoices",
          attributes: {
            item_type: "invoice",
            description: `Markala sipariş ${order.orderNumber}`,
            issue_date: today,
            currency: "TRL",
          },
          relationships: {
            contact: { data: { type: "contacts", id: contactId } },
            details: { data: details },
          },
        },
      });

      this.logger.log(`Paraşüt fatura oluşturuldu: order=${order.orderNumber} invoice=${created.data.id}`);
      return { invoiceId: created.data.id, status: "issued" };
    } catch (e) {
      this.logger.error(`Paraşüt fatura hatası order=${orderId}: ${(e as Error).message}`);
      return { invoiceId: "", status: "failed" };
    }
  }

  // === Cari hesap (B2B açık hesap) — aylık toplu ekstre faturası ===
  /**
   * Bir kurumsal müşterinin bir aydaki açık-hesap (cari) siparişlerini TEK bir
   * sales_invoice'ta toplar (her sipariş bir kalem). Sipariş bazlı
   * `createInvoiceFromOrder` ile aynı altyapıyı (contact/product upsert, JSON:API)
   * paylaşır; tek fark, kalemlerin tek-tek siparişler yerine aylık dökümü temsil etmesidir.
   *
   * Sistem tutarları KDV DAHİL saklanır → Paraşüt'e NET (KDV hariç) gönderilir.
   * Hata fırlatmaz; { status } ile sonucu bildirir (no-op = "skipped").
   */
  async createMonthlyStatementInvoice(input: {
    contact: {
      email: string;
      fullName: string;
      taxNumber?: string;
      taxOffice?: string;
      phone?: string;
      address?: string;
      city?: string;
      district?: string;
    };
    /** "2026-05" gibi YYYY-MM — fatura açıklamasında kullanılır. */
    period: string;
    /** Her açık-hesap siparişi bir kalem: KDV DAHİL brüt tutar. */
    lines: Array<{ description: string; grossAmount: number }>;
  }): Promise<{ invoiceId: string; status: "issued" | "failed" | "skipped" }> {
    if (!this.isConfigured()) {
      this.logger.warn(`[Paraşüt yapılandırılmamış] aylık ekstre faturası atlandı: ${input.contact.email} ${input.period}`);
      return { invoiceId: "", status: "skipped" };
    }
    if (!input.lines.length) return { invoiceId: "", status: "skipped" };
    try {
      const isCorporate = Boolean(input.contact.taxNumber);
      const { contactId } = await this.upsertContact({
        email: input.contact.email,
        fullName: input.contact.fullName,
        accountType: isCorporate ? "corporate" : "individual",
        taxNumber: input.contact.taxNumber,
        taxOffice: input.contact.taxOffice,
        phone: input.contact.phone,
        address: input.contact.address,
        city: input.contact.city,
        district: input.contact.district,
      });
      if (!contactId) return { invoiceId: "", status: "failed" };

      const vatRate = 20;
      const grossToNet = (gross: number) => Math.round((gross / (1 + vatRate / 100)) * 100) / 100;

      const details: Array<Record<string, unknown>> = [];
      for (const line of input.lines) {
        const netUnit = grossToNet(line.grossAmount);
        // Her kalem bir Paraşüt product'ına bağlı olmalı → genel "Açık Hesap Sipariş" ürünü.
        const productId = await this.upsertProduct("Açık Hesap Sipariş", netUnit, vatRate);
        details.push({
          type: "sales_invoice_details",
          attributes: {
            quantity: 1,
            unit_price: netUnit,
            vat_rate: vatRate,
            description: line.description.slice(0, 250),
          },
          relationships: {
            product: { data: { type: "products", id: productId } },
          },
        });
      }

      const today = new Date().toISOString().slice(0, 10);
      const created = await this.api<{ data: { id: string } }>("POST", "/sales_invoices", {
        data: {
          type: "sales_invoices",
          attributes: {
            item_type: "invoice",
            description: `Markala cari hesap ekstresi ${input.period}`,
            issue_date: today,
            currency: "TRL",
          },
          relationships: {
            contact: { data: { type: "contacts", id: contactId } },
            details: { data: details },
          },
        },
      });

      this.logger.log(`Paraşüt aylık ekstre faturası: ${input.contact.email} ${input.period} invoice=${created.data.id}`);
      return { invoiceId: created.data.id, status: "issued" };
    } catch (e) {
      this.logger.error(`Paraşüt aylık ekstre fatura hatası ${input.contact.email} ${input.period}: ${(e as Error).message}`);
      return { invoiceId: "", status: "failed" };
    }
  }
}
