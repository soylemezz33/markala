import type { MatrixCell } from "@markala/types";
import type { ProductParameter, ProductWithParams } from "./legacy-types";
import { PRODUCTION_TOLERANCE_PARAGRAPH } from "./notes";

/**
 * Ürün görseli URL üreticisi.
 * Şu an: /api/mockup endpoint'inden kategori-temalı UI/UX SVG mockup üretir.
 * Hasan ileride gerçek ürün fotoğraflarını /public/images/products/[slug]/X.jpg
 * altına yüklerse helper'ı geri çevirip yerel dosyalara dönülebilir.
 */
const prodImg = (slug: string, i: number = 1) => `/api/mockup?slug=${slug}&v=${i}&w=1200&h=1200`;
const note = (s: string) => `${s}${PRODUCTION_TOLERANCE_PARAGRAPH}`;

/**
 * Matrix yardımcısı: satır × sütun fiyat tablosu.
 * Her satırda `prices` map'i var; sütun id'lerinden fiyatı bulup hücre üretir.
 * Boş hücre (— işareti) için ilgili sütunu prices'a koymayın.
 */
function buildMatrix(args: {
  id?: string;
  label?: string;
  matrixNote?: string;
  rows: Array<{
    id: string;
    label: string;
    sublabel?: string;
    group?: string;
    code?: string;
    prices: Record<string, number>;
    badges?: Record<string, string>;
  }>;
  cols: Array<{ id: string; label: string; sublabel?: string }>;
  defaultRowId?: string;
  defaultColId?: string;
}): ProductParameter {
  const cells: MatrixCell[] = [];
  for (const r of args.rows) {
    for (const c of args.cols) {
      const price = r.prices[c.id];
      if (price === undefined) continue;
      cells.push({
        id: `${r.id}-${c.id}`,
        rowId: r.id,
        colId: c.id,
        code: r.code,
        price,
        badge: r.badges?.[c.id],
      });
    }
  }
  const dRow = args.defaultRowId ?? args.rows[0]?.id ?? "";
  const dCol = args.defaultColId ?? args.cols[0]?.id ?? "";
  return {
    id: args.id ?? "varyant",
    label: args.label ?? "Paket / Ebat × Adet",
    kind: "matrix",
    required: true,
    matrixNote: args.matrixNote,
    rows: args.rows.map(({ id, label, sublabel, group }) => ({ id, label, sublabel, group })),
    cols: args.cols,
    cells,
    defaultCellId: `${dRow}-${dCol}`,
  };
}

// === Ortak adet sütunları ===
const ADET_1K_KATLARI = [
  { id: "1000", label: "1.000 Adet" },
  { id: "2000", label: "2.000 Adet" },
  { id: "3000", label: "3.000 Adet" },
  { id: "5000", label: "5.000 Adet" },
  { id: "10000", label: "10.000 Adet" },
];

const adet1kPrices = (p: number) => ({
  "1000": p,
  "2000": p * 2,
  "3000": p * 3,
  "5000": p * 5,
  "10000": p * 10,
});

// ============================================================================
// 1. KLASİK KARTVİZİT — 21 paket × 5 adet, tek ebat 82×52 mm
// ============================================================================
const klasikKartvizit: ProductWithParams = {
  slug: "klasik-kartvizit",
  name: "Klasik Kartvizit",
  categorySlug: "kartvizit",
  sku: "MK-KRT-CLS",
  brand: "Markala",
  shortDescription: "Tek ebat 82×52 mm — EKO, LAK ve VIP serileri · Min. 1.000 adet",
  description: note(
    "Profesyonel iş hayatında ilk izlenimin yarısını oluşturan kartvizitleriniz, Markala'nın 21 farklı paket varyantından (EKO / LAK / VIP) seçtiğiniz konfigürasyonla tek ebat 82×52 mm boyutunda üretilir. Kâğıt gramajı 250 gr Bristol'den 800 gr sıvama bristole; kaplama mat/parlak selefondan kabartma laklı altın yaldıza, kesim düz formdan oval/özel forma kadar uzanır. Minimum sipariş 1.000 adet, devamı 2.000-3.000-5.000-10.000 adet kademelerinde uygulanır. Tasarım dosyanız CMYK 300 dpi PDF olarak gönderilmeli, kenarda 2 mm taşma payı bırakılmalıdır. Üretim 1-2 iş günü, DHL kargo 81 ile 1-3 iş günü.",
  ),
  basePrice: 0,
  startingPrice: 200,
  sizeLabel: "Tek Ebat: 82 × 52 mm · Çift Yön Renkli",
  productionTime: "1-2 iş günü",
  images: [prodImg("klasik-kartvizit", 1), prodImg("klasik-kartvizit", 2), prodImg("klasik-kartvizit", 3)],
  badges: ["cok-satilan", "hizli-sevkiyat"],
  bestseller: true,
  rating: { average: 4.8, count: 247 },
  features: [
    "Tek standart ebat: 82 × 52 mm — kart cüzdanına tam uyum",
    "21 paket varyantı: EKO (6) / LAK (10) / VIP (3)",
    "250-800 gr aralığında Bristol/Kuşe/Sıvama kâğıt seçenekleri",
    "Mat & parlak selefon, kabartma lak, altın/gümüş yaldız ekstraları",
    "Düz, oval ve özel form kesim",
    "Minimum 1.000 adet — toplu sipariş kademeleri",
    "1-2 iş günü üretim, 81 ile DHL kargo",
  ],
  useCases: [
    "Yeni kurulan şirketler için kurumsal kimlik seti",
    "Avukat, doktor, mali müşavir, mimar gibi meslek mensupları",
    "Esnaf, mağaza ve hizmet sektörü çalışanları",
    "Kurumsal etkinlik ve fuar dağıtımları",
  ],
  specifications: [
    { label: "Standart Ebat", value: "82 × 52 mm" },
    { label: "Baskı", value: "Çift Yön Renkli (4+4) — paket bazlı varyasyonlar" },
    { label: "Renk Sistemi", value: "CMYK 300 dpi" },
    { label: "Tasarım Dosyası", value: "PDF / AI / PSD — taşma payı 2 mm" },
    { label: "Üretim Süresi", value: "1-2 iş günü" },
    { label: "Kargo", value: "DHL Türkiye geneli, 1-3 iş günü" },
  ],
  faqs: [
    { q: "Neden tek ebat? Kare ya da mini istesem?", a: "Standart 82×52 mm ebat, dünyada en yaygın kullanılan ve cüzdan/kart cebine en uyumlu boyuttur. Üretim verimliliği ve fiyat avantajı bu standartla sağlanır. Kare/mini gibi özel ebatlar için S-COK, S-SEK, AC-SEK, VIP gibi özel kesim paketlerine yönlendiririz." },
    { q: "EKO, LAK ve VIP arasındaki fark nedir?", a: "EKO serisi 250-350 gr Bristol/Kuşe üzerine standart selefon ile günlük kurumsal kullanım. LAK serisi 350-800 gr ağır gramajlarda mat selefon + kabartma lak + özel kesim ile premium hissiyat. VIP serisi 350 gr kuşeye altın/gümüş yaldız + özel kesim ekleyerek protokol-üst yönetim için lüks segment." },
    { q: "Minimum sipariş 1.000 adetten az olur mu?", a: "Hayır. Matbaa baskı maliyet verimliliği için 1.000 adetten başlar. Daha az adet için Trodat kaşe veya promosyon magneti gibi ürünlere yönlendirebiliriz." },
  ],
  relatedSlugs: ["trodat-printy-4912", "magnet-promosyon", "antetli-kagit", "kase-trodat-4912"],
  parameters: [
    buildMatrix({
      label: "Paket × Adet",
      matrixNote: "Tek ebat 82 × 52 mm — Çift Yön Renkli. Tabloda paketinizi ve adedi seçin.",
      rows: [
        // EKO
        { id: "nk", code: "NK", group: "EKO", label: "NK — Ekonomik", sublabel: "250 gr Bristol · Tek Yön Renkli · Parlak Selefonlu", prices: adet1kPrices(210) },
        { id: "nka", code: "NKA", group: "EKO", label: "NKA — Eko + Arka Siyah", sublabel: "250 gr Bristol · Tek Yön Renkli · Parlak Selefonlu · Arkası Tek Renk Siyah", prices: adet1kPrices(220) },
        { id: "nsk", code: "NSK", group: "EKO", label: "NSK — 300 gr Bristol", sublabel: "300 gr Bristol · Tek Yön Renkli · Arkası Tek Renk Siyah", prices: adet1kPrices(200) },
        { id: "mna", code: "MNA", group: "EKO", label: "MNA — Mat Selefon", sublabel: "350 gr Bristol · Tek Yön Renkli · Mat Selefonlu · Arkası Tek Renk Siyah", prices: adet1kPrices(240) },
        { id: "cyp", code: "CYP", group: "EKO", label: "CYP — Çift Yön Parlak Selefon", sublabel: "350 gr Kuşe · Çift Yön Renkli · Parlak Selefonlu", prices: adet1kPrices(290), badges: { "1000": "EN ÇOK" } },
        { id: "cym", code: "CYM", group: "EKO", label: "CYM — Çift Yön Mat Selefon", sublabel: "350 gr Kuşe · Çift Yön Renkli · Mat Selefonlu", prices: adet1kPrices(300) },
        // LAK
        { id: "kl", code: "KL", group: "LAK", label: "KL — Kabartma Lak (Tek Yön)", sublabel: "350 gr Kuşe · Tek Yön Renkli · Mat Selefon · Kabartma Lak", prices: adet1kPrices(290) },
        { id: "cyml4", code: "CYML4", group: "LAK", label: "CYML4 — Çift Yön Lak 400 gr", sublabel: "400 gr Kuşe · Çift Yön Renkli · Mat Selefon · Lak", prices: adet1kPrices(400) },
        { id: "o-cok", code: "O-COK", group: "LAK", label: "O-COK — Oval Kesim + Kabartma Lak", sublabel: "350 gr Kuşe · Çift Yön Renkli · Mat Selefon · Kabartma Lak · Oval Kesim", prices: adet1kPrices(420) },
        { id: "s-cok", code: "S-COK", group: "LAK", label: "S-COK — Özel Kesim + Kabartma Lak", sublabel: "350 gr Kuşe · Çift Yön Renkli · Mat Selefon · Kabartma Lak · Özel Kesim", prices: adet1kPrices(500) },
        { id: "o-sek", code: "O-SEK", group: "LAK", label: "O-SEK — Sıvama Oval Kesim", sublabel: "700 gr Sıvama · Mat Selefon · Kabartma Lak · Oval Kesim · Çift Yön", prices: adet1kPrices(640) },
        { id: "eko-sek", code: "EKO-SEK", group: "LAK", label: "EKO-SEK — Eko Sıvama Oval (82×50)", sublabel: "A.Bristol Sıvama · Mat Selefon · Kabartma Lak · Oval Kesim · Çift Yön (Bitmiş 82×50 mm)", prices: adet1kPrices(580) },
        { id: "s-sek", code: "S-SEK", group: "LAK", label: "S-SEK — Sıvama Özel Kesim", sublabel: "700 gr Sıvama · Mat Selefon · Kabartma Lak · Özel Kesim · Çift Yön", prices: adet1kPrices(740) },
        { id: "a-sek", code: "A-SEK", group: "LAK", label: "A-SEK — Tek Yön Altın Yaldız + Özel Kesim", sublabel: "700 gr Sıvama · Mat Selefon · Kabartma Lak · Tek Yön Altın Yaldız · Özel Kesim", prices: adet1kPrices(950) },
        { id: "ac-sek", code: "AC-SEK", group: "LAK", label: "AC-SEK — Çift Yön Altın Yaldız + Özel Kesim", sublabel: "700 gr Sıvama · Mat Selefon · Kabartma Lak · Çift Yön Altın Yaldız · Özel Kesim", prices: adet1kPrices(1100) },
        { id: "tank", code: "TANK", group: "LAK", label: "TANK — 800 gr Sıvama Özel Kesim", sublabel: "800 gr Bristol Sıvama · Mat Selefon · Kabartma Lak · Özel Kesim · Çift Yön", prices: adet1kPrices(700) },
        // VIP
        { id: "ay", code: "AY", group: "VIP", label: "AY — Altın Yaldızlı + Arka Siyah", sublabel: "350 gr Bristol · Tek Yön Renkli · Mat Selefon · Altın Yaldızlı · Arka Tek Renk Siyah", prices: adet1kPrices(520) },
        { id: "gy", code: "GY", group: "VIP", label: "GY — Gümüş Yaldızlı + Arka Siyah", sublabel: "350 gr Bristol · Tek Yön Renkli · Mat Selefon · Gümüş Yaldızlı · Arka Tek Renk Siyah", prices: adet1kPrices(560) },
        { id: "vip", code: "VIP", group: "VIP", label: "VIP — Çift Yön Özel Kesim Altın Yaldız", sublabel: "350 gr Kuşe · Çift Yön Renkli · Mat Selefon · Özel Kesim · Lak · Ön Yüz Altın Yaldız", prices: adet1kPrices(780) },
      ],
      cols: ADET_1K_KATLARI,
      defaultRowId: "cyp",
      defaultColId: "1000",
    }),
  ],
  seo: {
    title: "Kartvizit Baskı 82×52 mm — EKO/LAK/VIP, 1.000 Adet 200 TL'den",
    description: "Tek ebat 82×52 mm kartvizit baskı 21 paket varyantı (EKO/LAK/VIP), min 1.000 adet 200 TL'den. Mat/parlak selefon, kabartma lak, altın yaldız, özel kesim. 1-2 iş günü üretim.",
    keywords: ["kartvizit baskı", "kartvizit basım", "82x52 kartvizit", "altın yaldız kartvizit", "kabartma lak kartvizit", "vip kartvizit", "online kartvizit baskı", "kartvizit fiyatları"],
  },
};

// ============================================================================
// 2. BROŞÜR — 115 gr Kuşe Çift Yön Renkli, 4 ebat × 4 adet
// ============================================================================
const brosur: ProductWithParams = {
  slug: "brosur",
  name: "Broşür — 115 gr Kuşe Çift Yön Renkli",
  categorySlug: "brosur",
  sku: "MK-BRS-115",
  brand: "Markala",
  shortDescription: "115 gr Kuşe Çift Yön Renkli — A7/A5/A4/A3 ebatlar, 1.000-10.000 adet",
  description: note(
    "Restoran menüsü, klinik tanıtımı, emlak portföyü, eğitim kurumu duyurusu ve kampanya broşürü için en yaygın tercih edilen 115 gr Kuşe çift yön renkli baskı. A7 (9.5×20 cm), A5 (14×20 cm), A4 (20×28 cm) ve A3 (28×40 cm) ebat seçenekleri; 1.000-10.000 adet aralığında kademeli fiyat. Tasarım hazır değilse ücretsiz şablon desteği. Otomatik katlama (Z/C) ek sipariş notu ile uygulanır.",
  ),
  basePrice: 0,
  startingPrice: 700,
  sizeLabel: "115 gr Kuşe · Çift Yön Renkli · 4 Ebat",
  productionTime: "1-2 iş günü",
  images: [prodImg("brosur", 1), prodImg("brosur", 2)],
  badges: ["cok-satilan", "hizli-sevkiyat"],
  bestseller: true,
  rating: { average: 4.8, count: 134 },
  features: [
    "115 gr Kuşe — orta gramaj, ekonomik ve dayanıklı",
    "Çift yön renkli (4+4) baskı",
    "A7 / A5 / A4 / A3 ebat seçenekleri",
    "1.000 / 2.000 / 5.000 / 10.000 adet kademeleri",
    "Otomatik katlama (Z/C/Çapraz) ek sipariş notu ile",
  ],
  useCases: [
    "Restoran menü, kafe-bar tanıtımı",
    "Klinik, doktor ve diş hekimi hizmet broşürü",
    "Emlak portföy, proje tanıtımı",
    "Eğitim kurumu, kreş, kurs broşürü",
    "Açılış, kampanya ve indirim el broşürü",
  ],
  specifications: [
    { label: "Kâğıt", value: "115 gr Kuşe" },
    { label: "Baskı", value: "Çift Yön Renkli (4+4)" },
    { label: "Ebatlar", value: "A7 9.5×20 / A5 14×20 / A4 20×28 / A3 28×40 cm" },
    { label: "Min. Adet", value: "1.000" },
    { label: "Üretim Süresi", value: "1-2 iş günü" },
  ],
  faqs: [
    { q: "Hangi ebatı seçmeliyim?", a: "A7 küçük el ilanı/menü kartı; A5 standart broşür/menü; A4 katlamalı tanıtım broşürü; A3 büyük afiş benzeri açık ekranlı broşür için uygundur." },
    { q: "Katlama yapılır mı?", a: "Evet — A4 ve A5 ebatlarda Z, C veya çapraz katlama sipariş notunda belirtilirse uygulanır. Otomatik makineyle kıvrılmadan yapılır." },
  ],
  relatedSlugs: ["pro-brosur", "selefonlu-brosur", "el-ilani", "afis-105gr"],
  parameters: [
    buildMatrix({
      label: "Ebat × Adet",
      matrixNote: "115 gr Kuşe · Çift Yön Renkli — sol sütundan ebat, üst satırdan adet seçin.",
      rows: [
        { id: "a7", label: "A7", sublabel: "9.5 × 20 cm", prices: { "1000": 700, "2000": 950, "5000": 2000, "10000": 3800 } },
        { id: "a5", label: "A5", sublabel: "14 × 20 cm", prices: { "1000": 800, "2000": 1050, "5000": 2200, "10000": 4000 } },
        { id: "a4", label: "A4", sublabel: "20 × 28 cm", prices: { "1000": 1400, "2000": 1900, "5000": 3900, "10000": 7500 } },
        { id: "a3", label: "A3", sublabel: "28 × 40 cm", prices: { "1000": 2750, "2000": 3750, "5000": 7500, "10000": 14500 } },
      ],
      cols: [
        { id: "1000", label: "1.000 Adet" },
        { id: "2000", label: "2.000 Adet" },
        { id: "5000", label: "5.000 Adet" },
        { id: "10000", label: "10.000 Adet" },
      ],
      defaultRowId: "a5",
      defaultColId: "1000",
    }),
  ],
  seo: {
    title: "Broşür Baskı — 115 gr Kuşe Çift Yön A7/A5/A4/A3, 700 TL'den",
    description: "115 gr Kuşe çift yön renkli broşür baskı, A7-A5-A4-A3 ebat seçenekleri, 1.000-10.000 adet kademeli fiyat. 1-2 iş günü üretim, Türkiye geneli kargo.",
    keywords: ["broşür baskı", "115 gr broşür", "kuşe broşür", "çift yön broşür", "a4 broşür", "a5 broşür", "tanıtım broşürü", "menü baskı"],
  },
};

// ============================================================================
// 3. PRO BROŞÜR — 128 gr Kuşe "Tam Ebat, Tam Gramaj" (sadece markala.com.tr)
// ============================================================================
const proBrosur: ProductWithParams = {
  slug: "pro-brosur",
  name: "Pro Broşür — 128 gr Kuşe Tam Ebat Tam Gramaj",
  categorySlug: "brosur",
  sku: "MK-BRS-PRO-128",
  brand: "Markala",
  shortDescription: "128 gr Kuşe Çift Yön — Tam Ebat & Tam Gramaj garantili (yalnızca markala.com.tr)",
  description: note(
    "Pro Broşür serimiz, sektörde sıkça karşılaşılan 'tasarruf adı altında küçültülmüş ebat ve düşük gramaj' uygulamasının tam tersi: ürün açıklamasında ne yazıyorsa o teslim edilir. Tam ebat, tam 128 gr Kuşe gramaj, çift yön renkli baskı; A7 (10×21 cm), A5 (15×21 cm), A4 (21×30 cm), A3 (30×42 cm) ebatlarında 1.000 ve 2.000 adet kademelerinde sunulur. Bu garanti yalnızca markala.com.tr üzerinden verilen siparişler için geçerlidir.",
  ),
  basePrice: 0,
  startingPrice: 900,
  sizeLabel: "128 gr Kuşe · Çift Yön Renkli · Tam Ebat",
  productionTime: "1-2 iş günü",
  images: [prodImg("pro-brosur", 1)],
  badges: ["yeni", "firsat"],
  bestseller: true,
  rating: { average: 4.9, count: 56 },
  features: [
    "128 gr Kuşe — 115 gr'a göre %11 daha kalın, premium hissiyat",
    "Tam ebat garantisi: A7=10×21, A5=15×21, A4=21×30, A3=30×42 cm",
    "Tam gramaj garantisi: 128 gr ölçüm sertifikalı",
    "Çift yön renkli (4+4) baskı",
    "Sadece markala.com.tr — başka yerde yok",
  ],
  useCases: [
    "Premium hissiyat isteyen marka tanıtımı",
    "Kurumsal portföy ve teklif broşürü",
    "Lüks restoran ve butik mağaza menüsü",
    "Mimarlık, iç mimarlık proje sunumu",
  ],
  specifications: [
    { label: "Kâğıt", value: "128 gr Kuşe (sertifikalı tam gramaj)" },
    { label: "Baskı", value: "Çift Yön Renkli (4+4)" },
    { label: "Ebatlar", value: "A7 10×21 / A5 15×21 / A4 21×30 / A3 30×42 cm (tam ebat)" },
    { label: "Min. Adet", value: "1.000" },
    { label: "Üretim Süresi", value: "1-2 iş günü" },
  ],
  faqs: [
    { q: "Tam ebat, tam gramaj ne demek?", a: "Sektörde 'A4 broşür' adıyla satılan ürünlerin önemli bir kısmı aslında 19×27 cm gibi küçültülmüş ebatta veya 100-110 gr gibi düşük gramajda üretilir. Pro Broşür hattımızda etikette ne yazıyorsa tam o ebat (mm hassasiyetinde) ve tam o gramaj (her parti için ölçüm) teslim edilir." },
    { q: "Neden 'sadece markala.com.tr'?", a: "Bu garantiyi vermek için ek üretim disiplini ve bağımsız kâğıt ölçümü gerekiyor; bayi/dropshipping kanallarına açmıyoruz. Doğrudan bizden alırsanız garantili." },
  ],
  relatedSlugs: ["brosur", "selefonlu-brosur", "el-ilani"],
  parameters: [
    buildMatrix({
      label: "Ebat × Adet",
      matrixNote: "128 gr Kuşe · Çift Yön · Tam Ebat — Sadece markala.com.tr garantisi.",
      rows: [
        { id: "a7", label: "A7", sublabel: "10 × 21 cm", prices: { "1000": 900, "2000": 1200 } },
        { id: "a5", label: "A5", sublabel: "15 × 21 cm", prices: { "1000": 1100, "2000": 1350 } },
        { id: "a4", label: "A4", sublabel: "21 × 30 cm", prices: { "1000": 1850, "2000": 2450 } },
        { id: "a3", label: "A3", sublabel: "30 × 42 cm", prices: { "1000": 3500, "2000": 4800 } },
      ],
      cols: [
        { id: "1000", label: "1.000 Adet" },
        { id: "2000", label: "2.000 Adet" },
      ],
      defaultRowId: "a4",
      defaultColId: "1000",
    }),
  ],
  seo: {
    title: "Pro Broşür — 128 gr Kuşe Tam Ebat Tam Gramaj | Sadece markala.com.tr",
    description: "128 gr Kuşe Pro Broşür — tam ebat, tam gramaj garantili. A7-A5-A4-A3, 1.000/2.000 adet. Premium tanıtım için, başka yerde bulunmaz. 900 TL'den.",
    keywords: ["pro broşür", "128 gr broşür", "tam ebat broşür", "premium broşür", "kuşe broşür baskı", "kalın broşür"],
  },
};

// ============================================================================
// 4. SELEFONLU BROŞÜR — 200 gr Kuşe Çift Yön Renkli Parlak Selefonlu
// ============================================================================
const selefonluBrosur: ProductWithParams = {
  slug: "selefonlu-brosur",
  name: "Selefonlu Broşür — 200 gr Kuşe Parlak Selefon",
  categorySlug: "brosur",
  sku: "MK-BRS-SLF-200",
  brand: "Markala",
  shortDescription: "200 gr Kuşe Çift Yön Renkli Parlak Selefonlu — yıkanabilir, dayanıklı",
  description: note(
    "Yağ, sıvı ve sürekli kullanıma karşı dayanıklı 200 gr Kuşe çift yön renkli baskı + parlak selefon kombinasyonu. Restoran-kafe menüsü, terapi-spa hizmet listesi, oto servis hizmet kataloğu, otel oda dosyası ve uzun ömürlü kullanılması beklenen tüm tanıtım dökümanları için ideal. Selefon kaplaması parmak izi tutmaz, parlak ve canlı renk verir.",
  ),
  basePrice: 0,
  startingPrice: 2850,
  sizeLabel: "200 gr Kuşe · Parlak Selefonlu · 4 Ebat",
  productionTime: "2-3 iş günü",
  images: [prodImg("selefonlu-brosur", 1)],
  badges: ["cok-satilan"],
  rating: { average: 4.8, count: 87 },
  features: [
    "200 gr Kuşe — kalın ve dayanıklı",
    "Çift yön renkli (4+4) baskı",
    "Parlak selefon kaplama — yıkanabilir, parmak izi tutmaz",
    "A7 / A5 / A4 / A3 ebat seçenekleri",
    "Yüksek adetlerde ekstra avantajlı fiyat",
  ],
  useCases: [
    "Restoran ve kafe menü kartları",
    "Spa, hamam ve estetik klinik hizmet listesi",
    "Otel oda direktif dosyası",
    "Oto servis ve teknik servis hizmet kataloğu",
    "Müze ve sergi rehber broşürü",
  ],
  specifications: [
    { label: "Kâğıt", value: "200 gr Kuşe" },
    { label: "Baskı", value: "Çift Yön Renkli (4+4)" },
    { label: "Kaplama", value: "Parlak Selefon (her iki yüzde)" },
    { label: "Ebatlar", value: "A7 10×21 / A5 15×21 / A4 21×30 / A3 30×42 cm" },
    { label: "Üretim Süresi", value: "2-3 iş günü" },
  ],
  faqs: [
    { q: "Selefon mat istesem olur mu?", a: "Standart parlak selefon. Mat selefon talebi için sipariş notuna ekleyin; aynı fiyatla uygulanır, üretim süresi 1 iş günü uzayabilir." },
    { q: "Yıkanabilir mi?", a: "Evet, parlak selefon su geçirmezdir. Nemli bezle silmek yeterlidir; deterjanlı su da kullanılabilir." },
  ],
  relatedSlugs: ["brosur", "pro-brosur", "kapi-aski-brosur"],
  parameters: [
    buildMatrix({
      label: "Ebat × Adet",
      matrixNote: "200 gr Kuşe · Çift Yön Renkli · Parlak Selefonlu",
      rows: [
        { id: "a7", label: "A7", sublabel: "10 × 21 cm", prices: { "3000": 3100, "6000": 6000, "12000": 11900 } },
        { id: "a5", label: "A5", sublabel: "15 × 21 cm", prices: { "2000": 3000, "4000": 5900, "6000": 8700 } },
        { id: "a4", label: "A4", sublabel: "21 × 30 cm", prices: { "1000": 2850, "2000": 5500, "4000": 10500 } },
        { id: "a3", label: "A3", sublabel: "30 × 42 cm", prices: { "1000": 5500, "2000": 10500, "4000": 20000 } },
      ],
      cols: [
        { id: "1000", label: "1.000 Adet" },
        { id: "2000", label: "2.000 Adet" },
        { id: "3000", label: "3.000 Adet" },
        { id: "4000", label: "4.000 Adet" },
        { id: "6000", label: "6.000 Adet" },
        { id: "12000", label: "12.000 Adet" },
      ],
      defaultRowId: "a4",
      defaultColId: "1000",
    }),
  ],
  seo: {
    title: "Selefonlu Broşür Baskı — 200 gr Kuşe Parlak Selefon Yıkanabilir",
    description: "200 gr Kuşe çift yön renkli parlak selefonlu broşür baskı. Restoran menüsü, otel direktif, spa hizmet listesi için yıkanabilir, dayanıklı.",
    keywords: ["selefonlu broşür", "menü baskı", "yıkanabilir broşür", "200 gr broşür", "parlak selefon broşür", "restoran menü baskı"],
  },
};

// ============================================================================
// 5. EL İLANI — 105 gr Kuşe Tek Yön Renkli
// ============================================================================
const elIlani: ProductWithParams = {
  slug: "el-ilani",
  name: "El İlanı — 105 gr Kuşe Tek Yön Renkli",
  categorySlug: "el-ilani",
  sku: "MK-ELI-105",
  brand: "Markala",
  shortDescription: "105 gr Kuşe Tek Yön Renkli — A7/A5/A4/A3, 2.000-12.000 adet",
  description: note(
    "Açılış, kampanya, indirim, açık hava etkinliği, seçim, açılış tanıtımı için en hızlı ve ekonomik dağıtım malzemesi olan tek yön renkli el ilanı; 105 gr Kuşe kâğıt üzerine 4+0 baskı tekniğiyle üretilir. A7'den A3'e kadar 4 ebat, 2.000'den başlayan adet kademeleri. Yüksek adetlerde m² fiyatı dramatik düşer.",
  ),
  basePrice: 0,
  startingPrice: 900,
  sizeLabel: "105 gr Kuşe · Tek Yön Renkli · 4 Ebat",
  productionTime: "1-2 iş günü",
  images: [prodImg("el-ilani", 1)],
  badges: ["cok-satilan", "hizli-sevkiyat"],
  bestseller: true,
  rating: { average: 4.7, count: 92 },
  features: [
    "105 gr Kuşe — el broşürü için ideal gramaj",
    "Tek yön renkli (4+0) baskı",
    "A7 / A5 / A4 / A3 ebat seçenekleri",
    "Min 2.000 adet, 12.000'e kadar avantajlı kademeler",
    "1-2 iş günü hızlı üretim",
  ],
  useCases: [
    "Açılış kampanyası ve indirim duyurusu",
    "Sokak/kapı kapı dağıtım",
    "Açık hava etkinlik davetiye",
    "Yerel seçim ve tanıtım kampanyası",
    "Restoran açılış menü tanıtımı",
  ],
  specifications: [
    { label: "Kâğıt", value: "105 gr Kuşe" },
    { label: "Baskı", value: "Tek Yön Renkli (4+0)" },
    { label: "Ebatlar", value: "A7 9.2×20 / A5 13.8×20 / A4 19×27.2 / A3 27.5×40 cm" },
    { label: "Üretim Süresi", value: "1-2 iş günü" },
  ],
  faqs: [
    { q: "Çift yön baskı yapılır mı?", a: "El ilanı standart tek yön baskı içindir. Çift yön ihtiyacı için 'Broşür' ürününe yönlendiririz; oradaki 115 gr Kuşe çift yön baskı el ilanı işine de uygundur." },
    { q: "Hangi ebat sokak dağıtımına uygun?", a: "A6 ve A5 ebatları cebe sığdığı için sokak dağıtımına en uygun. A4 ve A3 vitrin/cam üstüne yapıştırma için tercih edilir." },
  ],
  relatedSlugs: ["brosur", "afis-105gr", "etiket"],
  parameters: [
    buildMatrix({
      label: "Ebat × Adet",
      matrixNote: "105 gr Kuşe · Tek Yön Renkli (4+0)",
      rows: [
        { id: "a7", label: "A7", sublabel: "9.2 × 20 cm", prices: { "6000": 1700, "12000": 3100 } },
        { id: "a5", label: "A5", sublabel: "13.8 × 20 cm", prices: { "2000": 900, "4000": 1650, "6000": 2450, "8000": 3100 } },
        { id: "a4", label: "A4", sublabel: "19 × 27.2 cm", prices: { "2000": 1450, "4000": 2800, "6000": 4100, "8000": 5300 } },
        { id: "a3", label: "A3", sublabel: "27.5 × 40 cm", prices: { "2000": 2800, "4000": 5300, "6000": 7800, "8000": 10000 } },
      ],
      cols: [
        { id: "2000", label: "2.000 Adet" },
        { id: "4000", label: "4.000 Adet" },
        { id: "6000", label: "6.000 Adet" },
        { id: "8000", label: "8.000 Adet" },
        { id: "12000", label: "12.000 Adet" },
      ],
      defaultRowId: "a5",
      defaultColId: "2000",
    }),
  ],
  seo: {
    title: "El İlanı Baskı — 105 gr Kuşe Tek Yön A7/A5/A4/A3, 900 TL'den",
    description: "105 gr Kuşe tek yön renkli el ilanı baskı, 2.000-12.000 adet. Açılış, kampanya, sokak dağıtımı için ekonomik. 1-2 iş günü üretim.",
    keywords: ["el ilanı baskı", "el broşürü", "105 gr el ilanı", "kampanya el ilanı", "açılış broşürü", "sokak dağıtım broşürü"],
  },
};

// ============================================================================
// 6. AFİŞLER — 105 gr Kuşe Tek Yön Renkli, 2 ebat × 3 adet
// ============================================================================
const afis105gr: ProductWithParams = {
  slug: "afis-105gr",
  name: "Afiş — 105 gr Kuşe Tek Yön Renkli",
  categorySlug: "afis",
  sku: "MK-AFS-105",
  brand: "Markala",
  shortDescription: "105 gr Kuşe Tek Yön Renkli afiş — 34×49 ve 49×69 cm",
  description: note(
    "Konser, festival, etkinlik, sergi, mağaza vitrin tanıtımı için 105 gr Kuşe kâğıt üzerine tek yön renkli baskı. 34×49 cm (orta boy) ve 49×69 cm (büyük boy) ebatlarda, 250-1.000 adet aralığında. Hızlı üretim, vitrin teyzı için A2-A1 alternatifi. Kalın gramaj branda afişi için 'Vinil Branda Afiş' kategorimize bakınız.",
  ),
  basePrice: 0,
  startingPrice: 1750,
  sizeLabel: "105 gr Kuşe · Tek Yön Renkli · 2 Ebat",
  productionTime: "1-2 iş günü",
  images: [prodImg("afis-105gr", 1)],
  badges: ["yeni"],
  rating: { average: 4.7, count: 31 },
  features: [
    "105 gr Kuşe — afiş için orta gramaj",
    "Tek yön renkli (4+0) baskı",
    "34×49 cm ve 49×69 cm ebatlar",
    "250 / 500 / 1.000 adet kademeleri",
    "1-2 iş günü hızlı üretim",
  ],
  useCases: [
    "Konser, tiyatro, festival tanıtımı",
    "Mağaza vitrin kampanya afişi",
    "Sergi ve müze etkinlik duyurusu",
    "Spor müsabakası ve turnuva afişi",
    "Sinema film tanıtımı",
  ],
  specifications: [
    { label: "Kâğıt", value: "105 gr Kuşe" },
    { label: "Baskı", value: "Tek Yön Renkli (4+0)" },
    { label: "Ebatlar", value: "34×49 cm (orta) / 49×69 cm (büyük)" },
    { label: "Üretim Süresi", value: "1-2 iş günü" },
  ],
  faqs: [
    { q: "Vinil branda afişten farkı?", a: "Vinil branda 440 gr PVC malzeme, dış mekan ve uzun süreli kullanım için. Bu kâğıt afiş ise iç mekan ve geçici kullanım (etkinlik öncesi) için tasarlandı, m² fiyatı çok daha düşük." },
    { q: "Daha büyük ebat (A1, B1) yapıyor musunuz?", a: "Şu an standart bu iki ebat. Daha büyük ihtiyaç için Vinil Branda veya Dekota Baskı kategorimize göz atabilirsiniz." },
  ],
  relatedSlugs: ["el-ilani", "vinil-branda-440gr", "dekota-baski-5mm"],
  parameters: [
    buildMatrix({
      label: "Ebat × Adet",
      matrixNote: "105 gr Kuşe · Tek Yön Renkli — etkinlik ve vitrin için",
      rows: [
        { id: "34x49", label: "34 × 49 cm", sublabel: "Orta boy", prices: { "250": 1750, "500": 2250, "1000": 2950 } },
        { id: "49x69", label: "49 × 69 cm", sublabel: "Büyük boy", prices: { "250": 2700, "500": 3000, "1000": 4150 } },
      ],
      cols: [
        { id: "250", label: "250 Adet" },
        { id: "500", label: "500 Adet" },
        { id: "1000", label: "1.000 Adet" },
      ],
      defaultRowId: "34x49",
      defaultColId: "500",
    }),
  ],
  seo: {
    title: "Afiş Baskı — 105 gr Kuşe Tek Yön 34×49 / 49×69 cm, 1.750 TL'den",
    description: "105 gr Kuşe tek yön renkli kâğıt afiş baskı, 34×49 cm ve 49×69 cm ebatlarda 250-1.000 adet. Etkinlik, konser, vitrin için ekonomik çözüm.",
    keywords: ["afiş baskı", "kağıt afiş", "etkinlik afişi", "konser afişi", "kuşe afiş", "vitrin afişi", "105 gr afiş"],
  },
};

export const matbaaProducts: ProductWithParams[] = [
  klasikKartvizit,
  brosur,
  proBrosur,
  selefonluBrosur,
  elIlani,
  afis105gr,
];
