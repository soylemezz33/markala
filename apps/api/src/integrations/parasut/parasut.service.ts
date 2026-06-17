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

      // KDV: Türkiye matbaa tipik %20. (unit_price KDV hariç kabul edilir.)
      const vatRate = 20;
      const details = order.items.map((it) => ({
        type: "sales_invoice_details",
        attributes: {
          quantity: it.quantity,
          unit_price: Number(it.unitPrice),
          vat_rate: vatRate,
          description: `${it.productName} — ${it.configurationSummary}`.slice(0, 250),
        },
      }));

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
}
