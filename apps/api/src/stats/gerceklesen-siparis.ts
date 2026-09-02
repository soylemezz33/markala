import type { Prisma } from "@prisma/client";

/**
 * "GERÇEKLEŞEN SİPARİŞ" TANIMI — TEK KAYNAK.
 *
 * Neden var (2026-09-02, Hasan: "hâlâ tutarsız"): bu tanım üç yerde AYRI AYRI
 * yazılmıştı ve üçü de birbirinden farklıydı:
 *
 *   stats.service orderCount   : silinmemiş + (ödendi VEYA cari)          → İPTAL DAHİL
 *   stats.service revenue      : silinmemiş + ödendi + iptal hariç        → CARİ HARİÇ
 *   profit.service             : silinmemiş + (ödendi VEYA cari) + iptal hariç
 *
 * Sonucu canlı veride görünüyordu: panel "26 sipariş / 25.401,63 ₺" diyordu —
 * sayı iptal edilmiş 529 ₺'lik bir siparişi (MK-MSYJMVPA-O9YN) içeriyor, ciro
 * içermiyordu. Ayrıca ciro cari (açık hesap) siparişlerini hiç saymıyordu; bugün
 * öyle sipariş olmadığı için görünmüyordu ama ilk kurumsal açık hesap siparişinde
 * ciro onu kaçıracaktı.
 *
 * KURAL: Panel, kâr analizi ve ileride eklenecek her rapor bu sabiti kullanır.
 * Kopyalanırsa tanımlar yine ayrışır — `gerceklesen-siparis.spec.ts` bunu korur.
 *
 * TANIM:
 *  - silinmemiş (soft-delete edilmiş sipariş yok sayılır)
 *  - iptal edilmemiş (ödenip sonra iptal edilen satış DEĞİLDİR)
 *  - ödemesi başarılı VEYA açık hesap (cari): cari siparişte online ödeme
 *    beklenmez, ay sonunda faturalanır — satış gerçekleşmiştir.
 */
export const GERCEKLESEN_SIPARIS = {
  deletedAt: null,
  status: { not: "iptal_edildi" },
  OR: [{ paymentStatus: "basarili" }, { paymentMethod: "cari" }],
} satisfies Prisma.OrderWhereInput;

/** Tarih aralığı eklenmiş hâli — rapor uçları `days` parametresi alır. */
export function gerceklesenSiparis(since?: Date): Prisma.OrderWhereInput {
  return since ? { ...GERCEKLESEN_SIPARIS, createdAt: { gte: since } } : GERCEKLESEN_SIPARIS;
}
