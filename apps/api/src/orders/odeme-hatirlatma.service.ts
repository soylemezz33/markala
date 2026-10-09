import { Injectable, Logger, NotFoundException, Optional } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { WhatsappService } from "../integrations/whatsapp/whatsapp.service";
import { ChatwootService } from "../integrations/chatwoot/chatwoot.service";

/**
 * ÖDEME HATIRLATMASI — panel düğmesi (2026-10-09, Hasan).
 *
 * Akış: WhatsApp şablonu müşteriye → panel iç notu (kim, ne zaman, ne yazıldı) →
 * Chatwoot konuşmasına özel not. Sıra önemli: mesaj gitmeden hiçbir iz yazılmaz,
 * mesaj gittikten sonra iz yazılamazsa işlem BAŞARILI sayılır (müşteri mesajı aldı).
 *
 * NEDEN AYRI SERVİS: OrdersService'in kurucusu 36 spec tarafından elle kuruluyor
 * (bkz. order-note.service.ts başlığı); oraya iki bağımlılık daha eklemek hepsine dokunmak olur.
 *
 * Kurallar ve metin: integrations/whatsapp/odeme-hatirlatma-mesaji.ts (saf, testli).
 */
@Injectable()
export class OdemeHatirlatmaService {
  private readonly logger = new Logger(OdemeHatirlatmaService.name);

  constructor(
    private prisma: PrismaService,
    // @Optional: WhatsApp/Chatwoot env'siz ortamlarda (spec, yerel) servis kurulabilsin.
    @Optional() private whatsapp?: WhatsappService,
    @Optional() private chatwoot?: ChatwootService,
  ) {}

  async gonder(
    orderId: string,
    aktor: { id?: string | null; email?: string | null; role?: string | null },
  ): Promise<{ ok: boolean; mesaj?: string; alici?: string; hata?: string }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, orderNumber: true },
    });
    if (!order) throw new NotFoundException("Sipariş bulunamadı.");
    if (!this.whatsapp) {
      return { ok: false, hata: "WhatsApp servisi bu ortamda kurulu değil." };
    }

    const sonuc = await this.whatsapp.odemeHatirlatmasiGonder(orderId);
    if (!sonuc.ok) return { ok: false, hata: sonuc.hata ?? "Hatırlatma gönderilemedi." };

    const yazar = aktor.email?.trim() || aktor.role || "Panel";
    const notGovdesi = `📤 Ödeme hatırlatması WhatsApp'tan gönderildi (${sonuc.alici ?? "-"}): "${sonuc.mesaj ?? ""}"`;
    // İz yazımı başarısız olsa bile müşteri mesajı aldı → akış başarılı. Yalnız log'a düşer.
    await this.prisma.orderNote
      .create({
        data: {
          orderId,
          authorId: aktor.id ?? null,
          authorName: yazar,
          authorRole: aktor.role ?? "admin",
          body: notGovdesi,
        },
      })
      .catch((e) => this.logger.warn(`hatırlatma notu yazılamadı order=${order.orderNumber}: ${(e as Error).message}`));

    await this.chatwoot
      ?.gidenMesajiNotEt(orderId, "📤 Ödeme hatırlatması gönderildi (panel)", sonuc.mesaj ?? "")
      .catch(() => undefined);

    this.logger.log(`ödeme hatırlatması gönderildi order=${order.orderNumber} alici=${sonuc.alici}`);
    return { ok: true, mesaj: sonuc.mesaj, alici: sonuc.alici };
  }
}
