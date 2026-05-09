/**
 * Mock müşteri yorumları — anasayfa ve ürün sayfalarında kullanılır.
 * Postgres bağlandığında prisma.review.findMany() ile değiştirilecek.
 */

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

export const reviews: Review[] = [
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
  {
    id: "rv-007",
    authorName: "Cem Yıldız",
    authorCompany: "Yıldız Catering",
    productSlug: "magnet",
    rating: 5,
    title: "Buzdolabı magnetleri",
    comment:
      "Sipariş çağrı için buzdolabı magneti bastırdık. 2.000 adet, baskı sonrası kesim çok düzgün, eğri yok. Müşteriler sürekli sevdiklerine veriyor — etkili reklam materyali.",
    verified: true,
    createdAt: "2026-03-15T17:00:00Z",
    helpful: 12,
  },
  {
    id: "rv-008",
    authorName: "Selin Öz",
    authorCompany: "Öz Avukatlık",
    productSlug: "kapakli-bloknot",
    rating: 4,
    title: "Müvekkil hediyeliği",
    comment:
      "Logolu kapaklı bloknot, 200 adet. Kapak deri görünümlü, premium bir his veriyor. Kalem hediyesi de eklemek isterdim ama Markala şu an pen sunmuyor — eklenirse mükemmel olur.",
    verified: true,
    createdAt: "2026-03-04T10:00:00Z",
    helpful: 5,
  },
  {
    id: "rv-009",
    authorName: "Hakan Doğan",
    authorCompany: "Doğan İnşaat",
    productSlug: "branda-afis",
    rating: 5,
    title: "Şantiye afişi 2 yıl dayandı",
    comment:
      "Şantiye girişine 2x3m branda afişimiz var, 2 yıl önce Markala'dan aldık. Mersin güneşi, deniz tuzu, rüzgâr — hâlâ aynı renk. Yeni şantiyeye 4 tane daha sipariş ettim.",
    verified: true,
    createdAt: "2026-02-25T08:00:00Z",
    helpful: 28,
  },
];

export function getProductReviews(slug: string, limit?: number): Review[] {
  const list = reviews
    .filter((r) => r.productSlug === slug)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return limit ? list.slice(0, limit) : list;
}

export function getFeaturedReviews(limit = 6): Review[] {
  return [...reviews]
    .filter((r) => r.rating >= 4 && r.comment.length > 100)
    .sort((a, b) => b.helpful - a.helpful)
    .slice(0, limit);
}

export function getProductRatingStats(slug: string): {
  average: number;
  count: number;
  distribution: Record<1 | 2 | 3 | 4 | 5, number>;
} {
  const list = reviews.filter((r) => r.productSlug === slug);
  if (list.length === 0) {
    return { average: 0, count: 0, distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };
  }
  const sum = list.reduce((s, r) => s + r.rating, 0);
  const distribution: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const r of list) distribution[r.rating]++;
  return {
    average: Math.round((sum / list.length) * 10) / 10,
    count: list.length,
    distribution,
  };
}
