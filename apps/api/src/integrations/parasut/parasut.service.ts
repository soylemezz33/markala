import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";

/**
 * Paraşüt e-fatura/e-arşiv entegrasyonu — STUB.
 *
 * FAZ 4'te:
 * - OAuth2 token alma (PARASUT_CLIENT_ID/SECRET + USERNAME/PASSWORD)
 * - Müşteri (contact) oluştur/güncelle
 * - Sipariş ödendiğinde sales_invoice oluştur
 * - e-Arşiv (bireysel) veya e-Fatura (kurumsal) gönder
 *
 * Lisan Fen ve Markala için ayrı company_id kullanılacak.
 * Lisan Fen Paraşüt company_id (referans): 427609
 *
 * Docs: https://paraşüt.com/api
 */
@Injectable()
export class ParasutService {
  private readonly logger = new Logger(ParasutService.name);
  constructor(private config: ConfigService) {}

  async createInvoiceFromOrder(orderId: string): Promise<{ invoiceId: string; status: "queued" | "issued" | "failed" }> {
    this.logger.warn(`[STUB] Paraşüt invoice for order ${orderId}`);
    return { invoiceId: `inv_${Date.now()}`, status: "queued" };
  }

  async upsertContact(input: {
    email: string;
    fullName: string;
    accountType: "individual" | "corporate";
    taxNumber?: string;
    taxOffice?: string;
    phone?: string;
    address?: string;
  }): Promise<{ contactId: string }> {
    this.logger.warn(`[STUB] Paraşüt contact upsert: ${input.email}`);
    return { contactId: `contact_${input.email.replace(/[^a-z0-9]/gi, "")}` };
  }
}
