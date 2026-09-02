/**
 * SSS verisi — TEK KAYNAK: admin panelinin "SSS Yönetimi" ekranı (GET /api/faqs/public).
 *
 * /yardim/sss sayfası bu ucu 2026-08-21'den beri kendi içinde çağırıyordu. Anasayfaya da
 * SSS eklenince (2026-09-01) aynı fetch iki yerde olacaktı; seçim kuralı burada tek yerde
 * dursun diye ayrıldı. Anasayfa soruları ELLE YAZILMAZ — panelden bir cevap düzeltilince
 * anasayfa da deploy'suz düzelir.
 */

const API =
  process.env.API_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL || "http://api:4000";

export interface Faq {
  id: string;
  question: string;
  answer: string;
  category: string;
  productSlug?: string | null;
  sortOrder: number;
}

/** Hata build'i ÖLDÜRMEZ (bkz. /yardim/sss): boş liste döner, bölüm hiç render edilmez. */
export async function getFaqs(): Promise<Faq[]> {
  try {
    const res = await fetch(`${API}/api/faqs/public`, { next: { revalidate: 300 } });
    if (!res.ok) return [];
    return (await res.json()) as Faq[];
  } catch {
    return [];
  }
}

/**
 * Anasayfa için soru seçimi — ilk kez gelen ziyaretçinin satın almadan önce sorduğu şeyler.
 *
 * KURAL: aşağıdaki kategori sırasından her birinin EN ÜST sorusu (sortOrder'a göre) alınır.
 * Sabit id listesi yazmadım bilerek — panelden soru silinince/sırası değişince anasayfa
 * kendiliğinden doğru kalır, kimsenin elle liste temizlemesi gerekmez.
 *
 * productSlug'lı sorular DIŞARIDA: onlar tek bir ürüne özel (örn. "Selefon ile UV lak farkı"
 * → klasik-kartvizit) ve yerleri ürün sayfasıdır, anasayfa değil.
 */
const ANASAYFA_KATEGORI_SIRASI = ["genel", "kargo", "tasarim", "odeme", "urun", "iade"];

export function anasayfaSorulari(faqs: Faq[]): Faq[] {
  const secilen: Faq[] = [];
  for (const kategori of ANASAYFA_KATEGORI_SIRASI) {
    const ilk = faqs
      .filter((f) => f.category === kategori && !f.productSlug)
      .sort((a, b) => a.sortOrder - b.sortOrder)[0];
    if (ilk) secilen.push(ilk);
  }
  return secilen;
}
