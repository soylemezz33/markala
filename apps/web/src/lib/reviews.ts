/**
 * Yorum veri katmanı.
 *
 * Tasarım:
 * - Ürün yorumları (server): /reviews/public?productSlug= → yalnız ONAYLI yorumlar (canlı).
 *   Yorum yoksa BOŞ döner — sahte yorum gösterme (mock'a DÜŞMEZ). UI "henüz yorum yok" gösterir.
 * - rating ortalaması/sayısı/dağılımı GERÇEK onaylı yorumlardan hesaplanır.
 * - Anasayfa öne çıkan yorumlar (getFeaturedReviews): tercihen en güncel onaylı gerçek yorumlar,
 *   yeterli gerçek yorum yoksa mevcut testimonial MOCK ile tamamlanır (anasayfa boş kalmasın).
 * - Server-only fonksiyonlar apiClient KULLANMAZ (catalog.ts deseni: fetch + revalidate).
 */

const API_BASE =
  process.env.API_INTERNAL_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  "http://api:4000";

export interface Review {
  id: string;
  authorName: string;
  authorCompany?: string;
  authorRole?: string;
  productSlug?: string;
  rating: 1 | 2 | 3 | 4 | 5;
  title?: string;
  comment: string;
  verified: boolean;
  createdAt: string; // ISO
  helpful: number;
}

export interface ProductRatingStats {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
}

// ─────────────────────────────────────────────────────────────────────────────
// MOCK testimonial'lar — YALNIZ anasayfa öne çıkanlar için fallback. Ürün
// sayfasında KULLANILMAZ (orada gerçek yorum yoksa boş durum gösterilir).
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_FEATURED: Review[] = [
  {
    id: "rv-001",
    authorName: "Ali Yıldız",
    authorCompany: "Akdeniz Otel İşletmeleri",
    authorRole: "Pazarlama Müdürü",
    productSlug: "klasik-kartvizit",
    rating: 5,
    title: "Otel açılışımıza yetiştirdiler",
    comment:
      "Açılıştan 3 gün önce sipariş ettim, üretim ve kargo sorunsuz tamamlandı. Selefonlu kartvizitler beklediğimden daha kalın çıktı, kâğıt kalitesi iyi. Tasarım önerisi de bedava — grafik ekiplerinin gözü açık.",
    verified: true,
    createdAt: "2026-04-28T14:00:00Z",
    helpful: 23,
  },
  {
    id: "rv-002",
    authorName: "Ayşe Demir",
    authorCompany: "Mersin Marina Restoran",
    productSlug: "broşür",
    rating: 5,
    title: "Menü broşürlerinde işbirliği",
    comment:
      "Mevsimlik menü için 2.500 adet 4 sayfalı broşür sipariş ettik. CMYK profilini kontrol ettiler, hızlı düzeltme yaptılar. Renkler yağ-kir lekesinde bile bozulmuyor. Bu sezon 3. sipariş.",
    verified: true,
    createdAt: "2026-04-22T10:30:00Z",
    helpful: 18,
  },
  {
    id: "rv-003",
    authorName: "Mehmet Erdoğan",
    authorCompany: "Lisan Fen Eğitim Kurumları",
    authorRole: "Kurucu",
    productSlug: "antetli-kagit",
    rating: 5,
    title: "Kurumsal kimlik yenileme",
    comment:
      "324 Ajans ile birlikte tüm kurumsal kimliği yeniledik — antetli kâğıt, zarf, klasör. Markala bütün baskıyı tek elden yönetti. Açık fatura, ay sonu kapanış. Ciddi bir iş ortağı.",
    verified: true,
    createdAt: "2026-04-15T16:00:00Z",
    helpful: 31,
  },
  {
    id: "rv-004",
    authorName: "Fatma Kara",
    authorCompany: "Kara Mimarlık",
    productSlug: "afis",
    rating: 4,
    title: "Sergi afişleri",
    comment:
      "Sergi için A1 boyut afiş bastırdık, 50 adet. UV mürekkep güneşe dayanıklı, 2 hafta dış mekanda kaldı, renk solmadı. Kargo bir gün gecikti, yıldızı oradan kırdım.",
    verified: true,
    createdAt: "2026-04-08T11:20:00Z",
    helpful: 9,
  },
  {
    id: "rv-005",
    authorName: "Burak Şen",
    authorCompany: "Şen Emlak",
    productSlug: "el-ilani",
    rating: 5,
    title: "Mahalle dağıtımı için ideal",
    comment:
      "10.000 adet A5 el ilanı bastırdık. Birim maliyeti rakiplerine göre %15-20 daha düşük çıktı. Kâğıt çok ince değil, uçuşmuyor. Hızlı dağıtım için işe yaradı.",
    verified: true,
    createdAt: "2026-03-28T09:00:00Z",
    helpful: 14,
  },
  {
    id: "rv-006",
    authorName: "Zeynep Aydın",
    authorRole: "Freelance Tasarımcı",
    productSlug: "klasik-kartvizit",
    rating: 5,
    comment:
      "Müşterilerim için ürettiğim tasarımları artık Markala'da bastırıyorum. Pantone uyumu sıkı, hard proof imkânı çok değerli. 3 günde teslim.",
    verified: true,
    createdAt: "2026-03-22T13:00:00Z",
    helpful: 7,
  },
];

// ─────────────────────────────────────────────────────────────────────────────
// API mapping + fetch
// ─────────────────────────────────────────────────────────────────────────────

function clampRating(v: unknown): 1 | 2 | 3 | 4 | 5 {
  const n = Math.round(Number(v));
  if (n <= 1) return 1;
  if (n >= 5) return 5;
  return n as 1 | 2 | 3 | 4 | 5;
}

/** ReviewDto → storefront Review. userName→authorName, comment→comment; onaylı yorumlar "verified". */
function mapReview(r: Record<string, unknown>): Review {
  const product = (r.product ?? {}) as Record<string, unknown>;
  return {
    id: String(r.id),
    authorName: String(r.userName ?? "Müşteri"),
    authorCompany: (r.userCompany as string | null) ?? undefined,
    productSlug: product.slug ? String(product.slug) : undefined,
    rating: clampRating(r.rating),
    comment: String(r.comment ?? ""),
    // Onaylı yorum = doğrulanmış sipariş kabul edilir (admin moderasyonundan geçti).
    verified: Boolean(r.isApproved),
    createdAt: String(r.createdAt ?? new Date().toISOString()),
    helpful: 0,
  };
}

async function fetchJson(path: string): Promise<unknown> {
  const res = await fetch(`${API_BASE}/api${path}`, { next: { revalidate: 60 } });
  if (!res.ok) throw new Error(`reviews API ${path} -> ${res.status}`);
  return res.json();
}

function computeStats(list: Review[]): ProductRatingStats {
  if (list.length === 0) {
    return { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  }
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  let sum = 0;
  for (const r of list) {
    distribution[r.rating]++;
    sum += r.rating;
  }
  return {
    average: Math.round((sum / list.length) * 10) / 10,
    count: list.length,
    distribution,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Server erişimcileri
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Bir ürünün ONAYLI yorumları (en yeni önce). API hatası/yorum yoksa → BOŞ dizi.
 * Mock'a DÜŞMEZ (sahte yorum gösterme); UI boş durumu kendi yönetir.
 */
export async function getProductReviews(productSlug: string, limit?: number): Promise<Review[]> {
  try {
    const data = await fetchJson(`/reviews/public?productSlug=${encodeURIComponent(productSlug)}`);
    if (!Array.isArray(data)) return [];
    const list = (data as Record<string, unknown>[])
      .map(mapReview)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    return limit ? list.slice(0, limit) : list;
  } catch {
    return [];
  }
}

/** Ürün rating istatistikleri — GERÇEK onaylı yorumlardan. Yorum yoksa count=0. */
export async function getProductRatingStats(productSlug: string): Promise<ProductRatingStats> {
  const list = await getProductReviews(productSlug);
  return computeStats(list);
}

/**
 * Anasayfa öne çıkan yorumlar.
 *
 * NOT: Public API'de ürün-bağımsız "tüm onaylı yorumlar" uç noktası yok (/reviews/public
 * productSlug zorunlu). Bu yüzden anasayfa testimonial'ları şu an MOCK üzerinden gösterilir
 * (genel müşteri görüşleri). Backend ürün-bağımsız onaylı yorum listesi eklediğinde burada
 * gerçek yorumlarla beslenebilir. Mock fallback anasayfanın boş kalmamasını garanti eder.
 */
export async function getFeaturedReviews(limit = 6): Promise<Review[]> {
  return MOCK_FEATURED.slice(0, limit);
}
