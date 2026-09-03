import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";

/**
 * Sipariş İÇ NOTU (2026-09-03) — panel personelinin birbirine bıraktığı notlar.
 *
 * NEDEN AYRI TABLO: Order.notes kolonu zaten DOLU bir işi yapıyor — müşterinin checkout
 * notunu ve idempotency etiketini ([[idem:<hash>]]) taşıyor; üzerine yazmak mükerrer
 * sipariş korumasını sessizce bozardı (buildNotesWithIdem, orders.service.ts).
 *
 * NEDEN AYRI SERVİS: OrdersService'in kurucusu 36 spec tarafından elle kuruluyor
 * (bkz. order-design.service.ts başlığı) — oraya yeni bağımlılık eklemek hepsine dokunmak olur.
 *
 * Notlar EKLEME-tabanlı: düzenleme yok, yanlış yazılan not silinir. Böylece "not sonradan
 * değiştirilmiş mi?" sorusu hiç doğmaz.
 */
@Injectable()
export class OrderNoteService {
  constructor(private prisma: PrismaService) {}

  /** Panelde gösterilen alanlar. authorId dışarı çıkmaz (iç kimlik). */
  private static readonly SELECT = {
    id: true,
    body: true,
    authorName: true,
    authorRole: true,
    createdAt: true,
  } as const;

  async list(orderId: string) {
    await this.orderVarMi(orderId);
    return this.prisma.orderNote.findMany({
      where: { orderId },
      select: OrderNoteService.SELECT,
      orderBy: { createdAt: "desc" },
    });
  }

  async add(orderId: string, body: string, author: { id?: string; email?: string; role?: string }) {
    await this.orderVarMi(orderId);
    // İkinci kapı: DTO'da @Transform ile kırpılıp doğrulanıyor ama servis başka bir
    // yerden çağrılırsa boş gövdeli not oluşmasın (canlıda bir kez oluştu, 2026-09-03).
    const metin = body.trim();
    if (!metin) throw new BadRequestException("Not boş olamaz.");
    return this.prisma.orderNote.create({
      data: {
        orderId,
        body: metin,
        authorId: author.id ?? null,
        // Ad snapshot'ı: personel hesabı silinse/adı değişse bile not okunabilir kalsın.
        // JWT yalnız sub/email/role taşıyor, ad DB'den okunuyor (e-posta yedek).
        authorName: await this.yazarAdi(author),
        authorRole: author.role ?? null,
      },
      select: OrderNoteService.SELECT,
    });
  }

  private async yazarAdi(author: { id?: string; email?: string }): Promise<string> {
    if (author.id) {
      const u = await this.prisma.user.findUnique({
        where: { id: author.id },
        select: { fullName: true, email: true },
      });
      const ad = (u?.fullName ?? "").trim();
      if (ad) return ad;
      if (u?.email) return u.email;
    }
    return (author.email ?? "").trim() || "Bilinmeyen kullanıcı";
  }

  /**
   * Not silme. Kendi notunu herkes siler; BAŞKASININ notunu yalnız admin/super_admin siler —
   * aksi halde bir personel diğerinin bıraktığı uyarıyı sessizce kaldırabilirdi.
   */
  async remove(orderId: string, noteId: string, actor: { id?: string; role?: string }) {
    const note = await this.prisma.orderNote.findFirst({
      where: { id: noteId, orderId },
      select: { id: true, authorId: true },
    });
    if (!note) throw new NotFoundException("Not bulunamadı.");
    const yonetici = actor.role === "admin" || actor.role === "super_admin";
    if (!yonetici && (!actor.id || note.authorId !== actor.id)) {
      throw new ForbiddenException("Yalnız kendi notunuzu silebilirsiniz.");
    }
    await this.prisma.orderNote.delete({ where: { id: noteId } });
    return { ok: true as const };
  }

  /** Var olmayan (veya silinmiş) siparişe not yazılmasın — yetim satır üretmesin. */
  private async orderVarMi(orderId: string) {
    const o = await this.prisma.order.findFirst({
      where: { id: orderId, deletedAt: null },
      select: { id: true },
    });
    if (!o) throw new NotFoundException("Sipariş bulunamadı.");
  }
}
