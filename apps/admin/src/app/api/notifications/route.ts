import { NextResponse } from "next/server";
import { getAdminApi } from "@/lib/api";

// nodejs: server-side BFF (session cookie → accessToken).
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Bildirim çanı + sol menü rozetleri — ikisi de TEK kaynaktan (admin stats) türetilir.
 * Tarayıcı token görmez; bu route session cookie ile API'yi çağırır (BFF).
 *
 * ÖNEMLİ — bu bir "gelen kutusu" değil, BEKLEYEN İŞ listesidir:
 * Sayılar canlı duruma bakar (siparişin durumu, mesajın okunma durumu). Bir bildirime
 * tıklamak onu "okundu" yapmaz; iş gerçekten yapılınca (sipariş durumu ilerleyince,
 * mesaj okundu işaretlenince) kendiliğinden düşer. 2026-08-20'de Hasan "tıklıyorum
 * gitmiyor" diye bildirdi — davranış buydu ama arayüz zil + sayaç olduğu için gelen
 * kutusu izlenimi veriyordu; başlık/alt metin bunu açıkça söyleyecek şekilde düzeltildi.
 */
export async function GET() {
  try {
    const api = await getAdminApi();
    const s = await api.adminStats();

    // Prisma OrderStatus enum değerleri ALT ÇİZGİ ile gelir (siparis_alindi, tasarim_bekleniyor).
    // Tireli varyantlarla da uyum için anahtarları normalize ederek (tire→alt çizgi) saklarız.
    const byStatus: Record<string, number> = {};
    for (const r of s.ordersByStatus ?? []) {
      byStatus[String(r.status).replace(/-/g, "_")] = r.count;
    }

    const unreadMessages = s.unreadMessages ?? 0;
    const newQuotes = s.newQuotes ?? 0;
    const pendingReviews = s.pendingReviews ?? 0;
    const pendingCorporate = s.pendingCorporate ?? 0;
    const tasarim = byStatus["tasarim_bekleniyor"] ?? 0;
    const yeni = byStatus["siparis_alindi"] ?? 0;
    const uretim = byStatus["uretimde"] ?? 0;

    // Bildirim listesi — en "insan bekliyor" olandan başlayarak sıralı.
    const items: Array<{ label: string; href: string }> = [];
    if (unreadMessages > 0)
      items.push({ label: `${unreadMessages} okunmamış mesaj`, href: "/iletisim-mesajlari" });
    if (newQuotes > 0)
      items.push({ label: `${newQuotes} yeni teklif talebi`, href: "/teklif-talepleri" });
    if (pendingCorporate > 0)
      items.push({ label: `${pendingCorporate} bekleyen kurumsal başvuru`, href: "/musteriler/kurumsal-basvurular" });
    if (yeni > 0) items.push({ label: `${yeni} yeni sipariş`, href: "/siparisler" });
    if (tasarim > 0) items.push({ label: `${tasarim} tasarım bekleyen sipariş`, href: "/siparisler" });
    if (uretim > 0) items.push({ label: `${uretim} üretimdeki sipariş`, href: "/siparisler" });
    if (pendingReviews > 0)
      items.push({ label: `${pendingReviews} onay bekleyen yorum`, href: "/yorumlar" });

    // Sol menü rozetleri: href → sayı. admin-shell bunu link'lerle eşleştirir.
    const badges: Record<string, number> = {};
    if (unreadMessages > 0) badges["/iletisim-mesajlari"] = unreadMessages;
    if (newQuotes > 0) badges["/teklif-talepleri"] = newQuotes;
    if (pendingCorporate > 0) badges["/musteriler/kurumsal-basvurular"] = pendingCorporate;
    if (pendingReviews > 0) badges["/yorumlar"] = pendingReviews;
    // Siparişlerde "işlem bekleyen" = yeni + tasarım bekleyen (üretimdekiler akışta, beklemiyor).
    if (yeni + tasarim > 0) badges["/siparisler"] = yeni + tasarim;

    // count = BEKLEYEN İŞ ADEDİ (eskiden kategori sayısıydı: 3 yeni sipariş + 2 mesaj → "2"
    // gösteriyordu, yanıltıcıydı). Artık toplam iş adedi.
    const count = Object.values(badges).reduce((a, b) => a + b, 0);

    return NextResponse.json({ count, items, badges });
  } catch {
    return NextResponse.json({ count: 0, items: [], badges: {} });
  }
}
