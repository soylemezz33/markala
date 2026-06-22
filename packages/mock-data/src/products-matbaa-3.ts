import type { MatrixCell } from "@markala/types";
import type { ProductParameter, ProductWithParams } from "./legacy-types";
import { PRODUCTION_TOLERANCE_PARAGRAPH } from "./notes";

const prodImg = (slug: string, i: number = 1) => `/api/mockup?slug=${slug}&v=${i}&w=1200&h=1200`;
const note = (s: string) => `${s}${PRODUCTION_TOLERANCE_PARAGRAPH}`;

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
      });
    }
  }
  const dRow = args.defaultRowId ?? args.rows[0]?.id ?? "";
  const dCol = args.defaultColId ?? args.cols[0]?.id ?? "";
  return {
    id: args.id ?? "varyant",
    label: args.label ?? "Varyant × Adet",
    kind: "matrix",
    required: true,
    matrixNote: args.matrixNote,
    rows: args.rows.map(({ id, label, sublabel, group }) => ({ id, label, sublabel, group })),
    cols: args.cols,
    cells,
    defaultCellId: `${dRow}-${dCol}`,
  };
}

// ============================================================================
// 15. ETİKET — 90 gr Kuşe Çıkartma Renkli, 6 varyant × 1.000 adet
// ============================================================================
const etiket: ProductWithParams = {
  slug: "etiket",
  name: "Etiket — 90 gr Kuşe Çıkartma Renkli",
  categorySlug: "etiket",
  sku: "MK-ETK-90",
  brand: "Markala",
  shortDescription: "90 gr Kuşe çıkartma — 6 varyant (kartvizit boy, özel kesim, altın yaldız)",
  description: note(
    "Ürün ambalajı, kavanoz/şişe etiketi, kargo paket etiketi ve promosyon stikerı için 90 gr Kuşe yapışkanlı çıkartma; 53×83 mm veya 52×82 mm kartvizit ebadında parlak/mat selefon, özel kesim ve altın yaldız ekstralarıyla 6 farklı varyantta sunulur. Büyük etiket için 15.5×25.5 ve 25.5×33 cm ebatlar da mevcut. Tek yön renkli baskı, 1.000 adet sabit paket.",
  ),
  basePrice: 0,
  startingPrice: 280,
  sizeLabel: "90 gr Kuşe Çıkartma · 6 Varyant",
  productionTime: "2-3 iş günü",
  images: [prodImg("etiket", 1)],
  badges: ["cok-satilan"],
  bestseller: true,
  rating: { average: 4.8, count: 41 },
  features: [
    "90 gr Kuşe yapışkanlı çıkartma",
    "53×83 mm / 52×82 mm / 15.5×25.5 / 25.5×33 cm ebatlar",
    "Parlak selefon, selefonsuz, özel kesim, altın yaldız varyantları",
    "Tek yön renkli (4+0) baskı",
    "1.000 adet sabit paket",
  ],
  useCases: [
    "Ürün ambalaj etiketi (kavanoz, şişe, paket)",
    "Kargo ve sevkiyat etiketi",
    "Mağaza fiyat ve promosyon stikerı",
    "Kozmetik, gıda, içecek ürün etiketi",
    "Kurumsal hediye paketleme",
  ],
  specifications: [
    { label: "Malzeme", value: "90 gr Kuşe yapışkanlı çıkartma" },
    { label: "Baskı", value: "Tek Yön Renkli (4+0)" },
    { label: "Adet", value: "1.000 (sabit paket)" },
    { label: "Üretim Süresi", value: "2-3 iş günü" },
  ],
  faqs: [
    { q: "Su geçirmez mi?", a: "Selefonlu varyantlar (E, EO, EOY, ETM, ETL) parlak selefon koruması sayesinde nemli ortama dayanır; gıda kavanozu ve kozmetik şişe etiketi için uygun. Selefonsuz (ES) varyantı sadece kuru ortam için." },
    { q: "Özel form (logo şeklinde) kesim yapıyor musunuz?", a: "Evet — EO ve EOY varyantları özel kesim opsiyonludur. Vektörel kesim çizgisi içeren tasarım gönderin, lazer/CNC ile dış formdan kesilir." },
  ],
  relatedSlugs: ["magnet-promosyon", "kase-trodat-4912", "klasik-kartvizit"],
  parameters: [
    buildMatrix({
      label: "Varyant",
      matrixNote: "90 gr Kuşe Çıkartma · Tek Yön Renkli — 1.000 adet sabit paket",
      rows: [
        { id: "e", label: "E — Parlak Selefonlu", sublabel: "53×83 mm · Tek Yön Renkli Parlak Selefon", code: "E", prices: { "1000": 300 } },
        { id: "es", label: "ES — Selefonsuz", sublabel: "53×83 mm · Tek Yön Renkli Selefonsuz", code: "ES", prices: { "1000": 280 } },
        { id: "eo", label: "EO — Özel Kesim Selefon", sublabel: "52×82 mm · Tek Yön Renkli Parlak Selefon Özel Kesim", code: "EO", prices: { "1000": 500 } },
        { id: "eoy", label: "EOY — Altın Yaldız", sublabel: "52×82 mm · Tek Yön Renkli Parlak Selefon Altın Yaldız", code: "EOY", prices: { "1000": 740 } },
        { id: "etm", label: "ETM — Orta Boy 15.5×25.5", sublabel: "15.5×25.5 cm · Tek Yön Renkli Parlak Selefon", code: "ETM", prices: { "1000": 2600 } },
        { id: "etl", label: "ETL — Büyük Boy 25.5×33", sublabel: "25.5×33 cm · Tek Yön Renkli Parlak Selefon", code: "ETL", prices: { "1000": 5100 } },
      ],
      cols: [{ id: "1000", label: "1.000 Adet" }],
      defaultRowId: "e",
      defaultColId: "1000",
    }),
  ],
  seo: {
    title: "Etiket Baskı — 90 gr Kuşe Çıkartma 6 Varyant, 280 TL'den",
    description: "90 gr Kuşe yapışkanlı etiket baskı 6 varyant — selefonlu/selefonsuz, özel kesim, altın yaldız. Ürün, kavanoz, şişe etiketi için 1.000 adet 280 TL'den.",
    keywords: ["etiket baskı", "yapışkan etiket", "ürün etiketi", "kavanoz etiketi", "şişe etiketi", "kargo etiketi", "altın yaldız etiket"],
  },
};

// ============================================================================
// 16. MAKBUZ — 54 gr Kendinden Kopyalı 1 Asıl 1 Suret, 8 cilt varyantı
// ============================================================================
const makbuz: ProductWithParams = {
  slug: "makbuz",
  name: "Makbuz — 54 gr Kendinden Kopyalı (1 Asıl + 1 Suret)",
  categorySlug: "makbuz",
  sku: "MK-MKB-54",
  brand: "Markala",
  shortDescription: "Restoran-esnaf-ticari makbuz — 50'lik cilt × 4 ebat × tek renk/renkli",
  description: note(
    "Esnaf, restoran, kafe, oto galerisi, kargo şirketi gibi günlük tahsilat-teslimat belgesi tutan işletmeler için 54 gr kendinden kopyalı kâğıt üzerine 1 asıl + 1 suret formatlı makbuz. Karbon kâğıdı kullanmadan altta otomatik kopya çıkar. 4 ebat × 2 renk seçeneği (tek renk siyah / tam renkli) × cilt sayısı, 50 yapraklık standart cilt formatı. Cilt sayfa sayısı varyanta göre 10 / 20 / 30 cilt değişir.",
  ),
  basePrice: 0,
  startingPrice: 780,
  sizeLabel: "50'lik Cilt · 1 Asıl + 1 Suret · 4 Ebat",
  productionTime: "3-4 iş günü",
  images: [prodImg("makbuz", 1)],
  badges: ["cok-satilan"],
  bestseller: true,
  rating: { average: 4.8, count: 56 },
  features: [
    "54 gr kendinden kopyalı (NCR) kâğıt — karbonsuz",
    "1 asıl + 1 suret format",
    "4 ebat: 10×14 / 10×20 / 14×20 / 20×29 cm",
    "Tek renk siyah veya tam renkli (CMYK)",
    "50 yaprak/cilt — 10 / 20 / 30 ciltlik paketler",
  ],
  useCases: [
    "Restoran ve kafe gün sonu makbuz",
    "Esnaf günlük tahsilat",
    "Oto galeri ön ödeme makbuzu",
    "Kargo / kurye teslim alındı belgesi",
    "Spor kulübü aidat makbuzu",
    "Apartman aidat ve gider makbuzu",
  ],
  specifications: [
    { label: "Kâğıt", value: "54 gr Kendinden Kopyalı (NCR)" },
    { label: "Format", value: "1 asıl + 1 suret" },
    { label: "Ebatlar", value: "10×14 / 10×20 / 14×20 / 20×29 cm" },
    { label: "Cilt", value: "50 yaprak / cilt" },
    { label: "Üretim Süresi", value: "3-4 iş günü" },
  ],
  faqs: [
    { q: "Karbon kâğıdı eklenir mi?", a: "Hayır gerek yok. Kendinden kopyalı (NCR) kâğıt kullanılır — üst yapraktaki kalem baskısı altta kimyasal reaksiyonla otomatik kopya çıkarır. Karbon kâğıdı kullanmaktan daha temiz." },
    { q: "Numaralandırma yapılır mı?", a: "Evet — sipariş notunda 'numaralı' yazın. Cilt başına ardışık numaralandırma standart ücretsiz; cilt arası ardışık numara için ek ücret." },
    { q: "3 nüsha (1 asıl + 2 suret) yapıyor musunuz?", a: "Standart 2 nüsha. 3 nüsha için sipariş notuyla istenebilir, %30 ek ücretle uygulanır." },
  ],
  relatedSlugs: ["antetli-kagit", "kase-trodat-4912", "kapakli-bloknot"],
  parameters: [
    buildMatrix({
      label: "Varyant",
      matrixNote: "54 gr NCR · 1 Asıl + 1 Suret — varyanta göre cilt sayısı (10/20/30)",
      rows: [
        { id: "m1", label: "M1 — 50'lik 20 Cilt", sublabel: "10×14 cm · 20 Cilt Tek Renk Siyah", code: "M1", prices: { "20": 1050 } },
        { id: "m2", label: "M2 — 50'lik 30 Cilt", sublabel: "10×20 cm · 30 Cilt Tek Renk Siyah", code: "M2", prices: { "30": 1700 } },
        { id: "m3", label: "M3 — 50'lik 10 Cilt", sublabel: "14×20 cm · 10 Cilt Tek Renk Siyah", code: "M3", prices: { "10": 780 } },
        { id: "m4", label: "M4 — 50'lik 10 Cilt", sublabel: "20×29 cm · 10 Cilt Tek Renk Siyah", code: "M4", prices: { "10": 1300 } },
        { id: "mr1", label: "MR1 — 50'lik 20 Cilt Renkli", sublabel: "10×14 cm · 20 Cilt Renkli", code: "MR1", prices: { "20": 1300 } },
        { id: "mr2", label: "MR2 — 50'lik 30 Cilt Renkli", sublabel: "10×20 cm · 30 Cilt Renkli", code: "MR2", prices: { "30": 2200 } },
        { id: "mr3", label: "MR3 — 50'lik 10 Cilt Renkli", sublabel: "14×20 cm · 10 Cilt Renkli", code: "MR3", prices: { "10": 1200 } },
        { id: "mr4", label: "MR4 — 50'lik 10 Cilt Renkli", sublabel: "20×29 cm · 10 Cilt Renkli", code: "MR4", prices: { "10": 1800 } },
      ],
      cols: [
        { id: "10", label: "10 Cilt" },
        { id: "20", label: "20 Cilt" },
        { id: "30", label: "30 Cilt" },
      ],
      defaultRowId: "m3",
      defaultColId: "10",
    }),
  ],
  seo: {
    title: "Makbuz Baskı — 54 gr NCR 1 Asıl + 1 Suret, 780 TL'den",
    description: "54 gr kendinden kopyalı (NCR) makbuz, 1 asıl + 1 suret format. 4 ebat × tek renk/renkli × 10/20/30 cilt. Esnaf, restoran, kargo için.",
    keywords: ["makbuz baskı", "kendinden kopyalı makbuz", "ncr makbuz", "esnaf makbuz", "restoran makbuz", "tahsilat makbuzu"],
  },
};

// ============================================================================
// 17. OTO PASPAS — 85 gr karft 34×49 cm Tek Renk
// ============================================================================
const otoPaspas: ProductWithParams = {
  slug: "oto-paspas",
  name: "Oto Paspas — 85 gr karft 34×49 cm Tek Renk",
  categorySlug: "oto-paspas",
  sku: "MK-PSP-85",
  brand: "Markala",
  shortDescription: "Oto galerisi ve servis için tek kullanımlık paspas — 1.000-5.000 adet",
  description: note(
    "Oto galerisi, oto servisi, ekspertiz ve kiralama firmalarının müşteri aracına yerleştirdiği tek kullanımlık 85 gr karft (kraft) kâğıttan 34×49 cm oto paspas; tek renk baskı (logo + iletişim). Sürücü ayağı kirinden aracın halı paspasını korur, müşteri memnuniyetinde belirgin etki. 1.000 / 2.000 / 5.000 adet kademeli toplu sipariş.",
  ),
  basePrice: 0,
  startingPrice: 1750,
  sizeLabel: "85 gr karft · 34×49 cm · Tek Renk",
  productionTime: "3-4 iş günü",
  images: [prodImg("oto-paspas", 1)],
  badges: ["yeni"],
  rating: { average: 4.7, count: 14 },
  features: [
    "85 gr karft (kraft) kâğıt — dayanıklı, doğal renk",
    "34×49 cm — sürücü tarafına tam uyum",
    "Tek renk baskı (logo + iletişim)",
    "Tek kullanımlık — hijyenik, çıkardıktan sonra atılır",
    "1.000 / 2.000 / 5.000 adet kademeleri",
  ],
  useCases: [
    "Oto galerisi araç teslim",
    "Oto servisi bakım sırasında halı koruma",
    "Ekspertiz ve hasarsızlık tespiti",
    "Araç kiralama (rent a car) teslim",
    "Lastik değişim ve oto yıkama",
  ],
  specifications: [
    { label: "Malzeme", value: "85 gr karft (kraft) kâğıt" },
    { label: "Ebat", value: "34 × 49 cm" },
    { label: "Baskı", value: "Tek Renk" },
    { label: "Üretim Süresi", value: "3-4 iş günü" },
  ],
  faqs: [
    { q: "Çift renkli baskı yapıyor musunuz?", a: "Standart tek renk. 2-3 renk için sipariş notuyla istenebilir, %25 ek ücretle uygulanır." },
    { q: "Yağa-suya dayanır mı?", a: "Karft kâğıt nem ve hafif yağa karşı yarı dayanıklıdır; bir tek kullanımlık kullanım süresi (saatler) için yeterli. Tam su geçirmez ihtiyacı için PE kaplı karft seçeneği için iletişime geçin." },
  ],
  relatedSlugs: ["amerikan-servis", "magnet-promosyon"],
  parameters: [
    buildMatrix({
      label: "Adet",
      matrixNote: "85 gr karft · 34×49 cm · Tek Renk",
      rows: [
        { id: "paspas", label: "Oto Paspas", sublabel: "34×49 cm · 85 gr karft · Tek Renk", code: "P", prices: { "1000": 1750, "2000": 2700, "5000": 4800 } },
      ],
      cols: [
        { id: "1000", label: "1.000 Adet" },
        { id: "2000", label: "2.000 Adet" },
        { id: "5000", label: "5.000 Adet" },
      ],
    }),
  ],
  seo: {
    title: "Oto Paspas Baskı — 85 gr karft 34×49 cm Tek Renk, 1.750 TL'den",
    description: "Oto galerisi-servis için 85 gr karft 34×49 cm tek kullanımlık paspas. Tek renk baskı, 1.000-5.000 adet. Müşteri aracını koruyun.",
    keywords: ["oto paspas", "kağıt paspas", "oto servis paspas", "araç paspası", "tek kullanımlık paspas", "oto galerisi paspas"],
  },
};

// ============================================================================
// 18. KÜP BLOKNOT — 80 gr 1.Hamur 78×78 mm Tek Renk
// ============================================================================
const kupBloknot: ProductWithParams = {
  slug: "kup-bloknot",
  name: "Küp Bloknot — 78×78 mm 80 gr 1.Hamur",
  categorySlug: "bloknot",
  sku: "MK-BLK-KUP",
  brand: "Markala",
  shortDescription: "Promosyon küp bloknot — 250'lik / 500'lük yaprak × 4 adet",
  description: note(
    "Ofis masası, kurumsal hediye seti, kongre çantası ve promosyon kampanyaları için 78×78 mm küp formunda bloknot; 80 gr 1.Hamur tek yön tek renk yapraklar, 250 veya 500 yaprak yüksekliğinde. İç yapraklar müşteri tarafından yerleştirilecektir (yığma teslim, montajsız). Kutu opsiyonu: Mat Selefonlu Kutu +240 TL, Mat Selefon + Kabartma Lak Kutu +1.500 TL.",
  ),
  basePrice: 0,
  startingPrice: 7200,
  sizeLabel: "78×78 mm · 80 gr 1.Hamur · Tek Renk",
  productionTime: "5-7 iş günü",
  images: [prodImg("kup-bloknot", 1)],
  badges: ["yeni"],
  rating: { average: 4.8, count: 12 },
  features: [
    "78×78 mm küp formu — masa için pratik",
    "80 gr 1.Hamur tek yön tek renk yaprak",
    "250'lik veya 500'lük yaprak yüksekliği",
    "100-1.000 adet bloknot kademeleri",
    "Kutu opsiyonu (mat selefon / mat selefon + kabartma lak)",
    "İç yapraklar müşteri tarafından yerleştirilecektir",
  ],
  useCases: [
    "Kurumsal yılbaşı ve doğum günü hediyesi",
    "Kongre, fuar, etkinlik çanta içeriği",
    "Otel oda/sürpriz hediye paketi",
    "Banka ve sigorta müşteri promosyonu",
    "Eczane, klinik müşteri ürünü",
  ],
  specifications: [
    { label: "Yaprak Ebadı", value: "78 × 78 mm" },
    { label: "Kâğıt", value: "80 gr 1.Hamur" },
    { label: "Baskı", value: "Tek Yön Tek Renk" },
    { label: "Yaprak Yüksekliği", value: "250'lik veya 500'lük" },
    { label: "Montaj", value: "İç yapraklar müşteri tarafından yerleştirilecek (yığma teslim)" },
    { label: "Üretim Süresi", value: "5-7 iş günü" },
  ],
  faqs: [
    { q: "İç yapraklar neden yığma teslim ediliyor?", a: "Küp bloknotun iç yaprakları yapışkanlı bağlı değil, gevşek yapraklar olarak yığma şeklinde teslim edilir. Bu sayede daha hızlı/ekonomik üretilir; alıcı kutuya kendisi yerleştirir." },
    { q: "Kutu seçenekleri nedir?", a: "Standart sade beyaz kutu fiyata dahil. Mat Selefonlu kutu için +240 TL, Mat Selefon + Kabartma Lak için +1.500 TL ek ücretle premium kutu sağlanır." },
  ],
  relatedSlugs: ["spiralli-bloknot", "kapakli-bloknot", "notluk"],
  parameters: [
    buildMatrix({
      label: "Yaprak Sayısı × Adet",
      matrixNote: "78×78 mm · 80 gr 1.Hamur Tek Renk · İç yapraklar müşteri tarafından yerleştirilecek",
      rows: [
        { id: "250lik", label: "250'lik Yaprak", sublabel: "250 yaprak / küp", group: "250LİK", prices: { "100": 7200, "250": 8750, "500": 11250, "1000": 17500 } },
        { id: "500luk", label: "500'lük Yaprak", sublabel: "500 yaprak / küp", group: "500LÜK", prices: { "100": 9375, "250": 13125, "500": 18125 } },
      ],
      cols: [
        { id: "100", label: "100 Adet" },
        { id: "250", label: "250 Adet" },
        { id: "500", label: "500 Adet" },
        { id: "1000", label: "1.000 Adet" },
      ],
      defaultRowId: "250lik",
      defaultColId: "250",
    }),
  ],
  seo: {
    title: "Küp Bloknot — 78×78 mm 80 gr 1.Hamur Tek Renk, 7.200 TL'den",
    description: "Kurumsal promosyon küp bloknot 78×78 mm, 250/500'lük yaprak, 100-1.000 adet. Mat selefon/kabartma lak kutu opsiyonu.",
    keywords: ["küp bloknot", "promosyon bloknot", "küp not kağıdı", "kurumsal hediye bloknot", "ofis bloknot"],
  },
};

// ============================================================================
// 19. SPİRALLİ BLOKNOT — 50'lik Cilt, 2 ebat × 5 kapak × 2 cilt sayısı
// ============================================================================
const spiralliBloknot: ProductWithParams = {
  slug: "spiralli-bloknot",
  name: "Spiralli Bloknot — 50'lik Cilt",
  categorySlug: "bloknot",
  sku: "MK-BLK-SPR",
  brand: "Markala",
  shortDescription: "Yandan spiralli bloknot — 9.4×13.3 / 14×20 cm × 5 kapak varyantı",
  description: note(
    "Ofis, eğitim, etkinlik ve promosyon için yandan spiralli bloknot; 50 yapraklık cilt formatında. İç yapraklar 80 gr 1.Hamur tek renk; kapak 5 farklı varyant (NK / CYP / CYM / CYML4 / SEK) seçilebilir. 9.4×13.3 cm (cep boyu) ve 14×20 cm (orta boy) ebatlar. **Önemli:** 14×20 cm ebatta yandan spiral ücreti otomatik eklenir — 500 cilt için +800 TL, 1.000 cilt için +1.600 TL.",
  ),
  basePrice: 0,
  startingPrice: 9375,
  sizeLabel: "50'lik Cilt · 80 gr 1.Hamur Tek Renk · 5 Kapak",
  productionTime: "5-7 iş günü",
  images: [prodImg("spiralli-bloknot", 1)],
  badges: ["yeni"],
  rating: { average: 4.7, count: 8 },
  features: [
    "Yandan spiralli — açıkken düz durabilir",
    "50 yaprak / cilt 80 gr 1.Hamur tek renk",
    "9.4×13.3 cm (cep) / 14×20 cm (orta) ebatlar",
    "5 kapak varyantı: NK / CYP / CYM / CYML4 / SEK",
    "500 / 1.000 cilt kademeleri",
    "14×20 ebat: spiral ücreti otomatik (500: +800 TL / 1.000: +1.600 TL)",
  ],
  useCases: [
    "Kurumsal promosyon ve etkinlik çantası",
    "Eğitim/seminer not bloknot",
    "Otel oda not bloknot",
    "Doktor reçete benzeri uzun not",
    "Mühendislik / teknik saha not",
  ],
  specifications: [
    { label: "Cilt", value: "50 yaprak / cilt" },
    { label: "İç Yaprak", value: "80 gr 1.Hamur Tek Renk" },
    { label: "Kapak", value: "NK / CYP / CYM / CYML4 / SEK" },
    { label: "Ebatlar", value: "9.4×13.3 cm / 14×20 cm" },
    { label: "Spiral", value: "Yandan metal spiral" },
    { label: "Üretim Süresi", value: "5-7 iş günü" },
  ],
  faqs: [
    { q: "Kapak varyantları neyi ifade eder?", a: "NK (Bristol selefonlu, ekonomik), CYP (Çift Yön Parlak Selefon), CYM (Çift Yön Mat Selefon), CYML4 (400 gr Mat Selefon Lak), SEK (Sıvama özel kesim premium). Kartvizit ürünündeki aynı kodlamayla uyumludur." },
    { q: "14×20 ebatta spiral neden ek ücretli?", a: "9.4×13.3 cm cep boy üretim makinesinde spiral standart, ek ücretsiz. 14×20 cm orta boy için ayrı spiral makinesi devreye girer; bu yüzden cilt başına ek ücret uygulanır." },
  ],
  relatedSlugs: ["kup-bloknot", "kapakli-bloknot", "kapaksiz-bloknot"],
  parameters: [
    buildMatrix({
      label: "Ebat / Kapak × Cilt",
      matrixNote: "50'lik Cilt · 80 gr 1.Hamur Tek Renk — 14×20 ebatta spiral otomatik ek (500: +800 / 1.000: +1.600 TL fiyata yansıtıldı)",
      rows: [
        { id: "9-nk", label: "B1 — NK Kapak", sublabel: "9.4×13.3 cm · NK", group: "9.4×13.3 cm", code: "B1", prices: { "500": 9375, "1000": 15375 } },
        { id: "9-cyp", label: "B2 — CYP Kapak", sublabel: "9.4×13.3 cm · CYP", group: "9.4×13.3 cm", code: "B2", prices: { "500": 10500, "1000": 16250 } },
        { id: "9-cym", label: "B3 — CYM Kapak", sublabel: "9.4×13.3 cm · CYM", group: "9.4×13.3 cm", code: "B3", prices: { "500": 10500, "1000": 16250 } },
        { id: "9-cyml4", label: "B4 — CYML4 Kapak", sublabel: "9.4×13.3 cm · CYML4", group: "9.4×13.3 cm", code: "B4", prices: { "500": 10750, "1000": 16875 } },
        { id: "9-sek", label: "B5 — SEK Kapak", sublabel: "9.4×13.3 cm · SEK", group: "9.4×13.3 cm", code: "B5", prices: { "500": 11500, "1000": 17750 } },
        { id: "14-nk", label: "B6 — NK Kapak (+spiral)", sublabel: "14×20 cm · NK", group: "14×20 cm", code: "B6", prices: { "500": 13375, "1000": 22750 } },
        { id: "14-cyp", label: "B7 — CYP Kapak (+spiral)", sublabel: "14×20 cm · CYP", group: "14×20 cm", code: "B7", prices: { "500": 14375, "1000": 23750 } },
        { id: "14-cym", label: "B8 — CYM Kapak (+spiral)", sublabel: "14×20 cm · CYM", group: "14×20 cm", code: "B8", prices: { "500": 14375, "1000": 23750 } },
        { id: "14-cyml4", label: "B9 — CYML4 Kapak (+spiral)", sublabel: "14×20 cm · CYML4", group: "14×20 cm", code: "B9", prices: { "500": 16000, "1000": 25000 } },
        { id: "14-sek", label: "B10 — SEK Kapak (+spiral)", sublabel: "14×20 cm · SEK", group: "14×20 cm", code: "B10", prices: { "500": 17500, "1000": 26875 } },
      ],
      cols: [
        { id: "500", label: "500 Cilt" },
        { id: "1000", label: "1.000 Cilt" },
      ],
      defaultRowId: "9-cyp",
      defaultColId: "500",
    }),
  ],
  seo: {
    title: "Spiralli Bloknot — 50'lik Cilt 9.4×13.3 / 14×20 cm, 9.375 TL'den",
    description: "Yandan spiralli 50'lik cilt bloknot, 9.4×13.3 / 14×20 cm × 5 kapak varyantı. Kurumsal promosyon, eğitim, otel için.",
    keywords: ["spiralli bloknot", "spiralli not defteri", "promosyon bloknot", "yandan spiralli", "50'lik cilt"],
  },
};

// ============================================================================
// 20. KAPAKLI BLOKNOT — Amerikan Cilt 50'lik, 2 ebat × 4 kapak × 2 cilt
// ============================================================================
const kapakliBloknot: ProductWithParams = {
  slug: "kapakli-bloknot",
  name: "Kapaklı Bloknot — Amerikan Cilt 50'lik",
  categorySlug: "bloknot",
  sku: "MK-BLK-KPK",
  brand: "Markala",
  shortDescription: "Amerikan cilt kapaklı bloknot — 9.4×13.3 / 14×20 cm × 4 kapak varyantı",
  description: note(
    "Üst kısmında yapışkanla cilt edilmiş Amerikan cilt formatında kapaklı bloknot; 50 yapraklık paket. İç yapraklar 80 gr 1.Hamur tek renk; kapak NK / CYP / CYM / CYML4 varyantlarında. **Özel kesim kapak farkı 550 TL'dir** (sipariş notunda belirtin).",
  ),
  basePrice: 0,
  startingPrice: 12375,
  sizeLabel: "Amerikan Cilt 50'lik · 4 Kapak Varyantı",
  productionTime: "5-7 iş günü",
  images: [prodImg("kapakli-bloknot", 1)],
  badges: ["yeni"],
  rating: { average: 4.7, count: 6 },
  features: [
    "Amerikan cilt — üst yapışkan cilt",
    "50 yaprak 80 gr 1.Hamur tek renk",
    "9.4×13.3 / 14×20 cm ebatlar",
    "4 kapak varyantı: NK / CYP / CYM / CYML4",
    "Özel kesim kapak farkı +550 TL (opsiyonel)",
  ],
  useCases: [
    "Kurumsal not bloknot",
    "Otel oda hizmet bloknot",
    "Eğitim seminer dağıtım",
    "Promosyon hediye seti içeriği",
  ],
  specifications: [
    { label: "Cilt", value: "Amerikan cilt 50 yaprak" },
    { label: "İç Yaprak", value: "80 gr 1.Hamur Tek Renk" },
    { label: "Kapak", value: "NK / CYP / CYM / CYML4" },
    { label: "Ebatlar", value: "9.4×13.3 cm / 14×20 cm" },
    { label: "Üretim Süresi", value: "5-7 iş günü" },
  ],
  faqs: [
    { q: "Amerikan cilt nedir?", a: "Yaprakların üst kısmından yapışkan ile bağlanması; sayfalar tek tek koparılabilir. Spiralli cilt yerine düz, yapışkan bağlı format." },
    { q: "Özel kesim kapak nasıl uygulanır?", a: "Sipariş notunda 'özel kesim kapak' yazın ve kesim formunu vektörel dosyada belirtin; +550 TL ek ücretle uygulanır." },
  ],
  relatedSlugs: ["spiralli-bloknot", "kapaksiz-bloknot", "kup-bloknot"],
  parameters: [
    buildMatrix({
      label: "Ebat / Kapak × Cilt",
      matrixNote: "Amerikan Cilt 50'lik · 80 gr 1.Hamur — Özel kesim kapak için sipariş notu + 550 TL",
      rows: [
        { id: "9-nk", label: "B16 — NK Kapak", sublabel: "9.4×13.3 cm · NK", group: "9.4×13.3 cm", code: "B16", prices: { "500": 12375, "1000": 15625 } },
        { id: "9-cyp", label: "B17 — CYP Kapak", sublabel: "9.4×13.3 cm · CYP", group: "9.4×13.3 cm", code: "B17", prices: { "500": 13250, "1000": 16250 } },
        { id: "9-cym", label: "B18 — CYM Kapak", sublabel: "9.4×13.3 cm · CYM", group: "9.4×13.3 cm", code: "B18", prices: { "500": 13375, "1000": 16375 } },
        { id: "9-cyml4", label: "B19 — CYML4 Kapak", sublabel: "9.4×13.3 cm · CYML4", group: "9.4×13.3 cm", code: "B19", prices: { "500": 15000, "1000": 18375 } },
        { id: "14-nk", label: "B20 — NK Kapak", sublabel: "14×20 cm · NK", group: "14×20 cm", code: "B20", prices: { "500": 15875, "1000": 21250 } },
        { id: "14-cyp", label: "B21 — CYP Kapak", sublabel: "14×20 cm · CYP", group: "14×20 cm", code: "B21", prices: { "500": 16875, "1000": 21875 } },
        { id: "14-cym", label: "B22 — CYM Kapak", sublabel: "14×20 cm · CYM", group: "14×20 cm", code: "B22", prices: { "500": 17000, "1000": 22000 } },
        { id: "14-cyml4", label: "B23 — CYML4 Kapak", sublabel: "14×20 cm · CYML4", group: "14×20 cm", code: "B23", prices: { "500": 18750, "1000": 23750 } },
      ],
      cols: [
        { id: "500", label: "500 Cilt" },
        { id: "1000", label: "1.000 Cilt" },
      ],
      defaultRowId: "9-cyp",
      defaultColId: "500",
    }),
  ],
  seo: {
    title: "Kapaklı Bloknot — Amerikan Cilt 50'lik, 12.375 TL'den",
    description: "Amerikan cilt kapaklı bloknot 9.4×13.3 / 14×20 cm × 4 kapak varyantı. 80 gr 1.Hamur, özel kesim kapak +550 TL.",
    keywords: ["kapaklı bloknot", "amerikan cilt bloknot", "promosyon bloknot", "kurumsal bloknot"],
  },
};

// ============================================================================
// 21. KAPAKSIZ BLOKNOT — 50'lik Tutkallı Cilt, 2 ebat × 2 cilt
// ============================================================================
const kapaksizBloknot: ProductWithParams = {
  slug: "kapaksiz-bloknot",
  name: "Kapaksız Bloknot — 50'lik Tutkallı Cilt",
  categorySlug: "bloknot",
  sku: "MK-BLK-NCV",
  brand: "Markala",
  shortDescription: "Kapaksız tutkallı bloknot — 80 gr 1.Hamur, alt karton baskısız",
  description: note(
    "En ekonomik bloknot çözümü: kapaksız, sadece üst tutkallı 50 yapraklık bloknot. 80 gr 1.Hamur tek renk iç yapraklar; alt karton baskısızdır (sade beyaz/karft). Hızlı promosyon dağıtımı ve günlük not için ideal.",
  ),
  basePrice: 0,
  startingPrice: 5625,
  sizeLabel: "50'lik Tutkallı Cilt · 80 gr 1.Hamur · Kapaksız",
  productionTime: "4-5 iş günü",
  images: [prodImg("kapaksiz-bloknot", 1)],
  rating: { average: 4.5, count: 11 },
  features: [
    "Üst tutkallı cilt — kapaksız",
    "50 yaprak 80 gr 1.Hamur tek renk",
    "Alt karton baskısız (sade)",
    "9.4×13.3 / 14×20 cm ebatlar",
    "500 / 1.000 cilt kademeleri",
    "En ekonomik bloknot seçeneği",
  ],
  useCases: [
    "Sokak/kapı kapı dağıtım",
    "Mağaza tezgah yanı not bloknot",
    "Otel resepsiyon hızlı not",
    "Etkinlik anlık not",
  ],
  specifications: [
    { label: "Cilt", value: "Üst tutkallı 50 yaprak" },
    { label: "İç Yaprak", value: "80 gr 1.Hamur Tek Renk" },
    { label: "Kapak", value: "Yok (kapaksız)" },
    { label: "Alt Karton", value: "Baskısız sade" },
    { label: "Ebatlar", value: "9.4×13.3 cm / 14×20 cm" },
    { label: "Üretim Süresi", value: "4-5 iş günü" },
  ],
  faqs: [
    { q: "Alt karton baskısı isteyebilir miyim?", a: "Standart baskısız. Marka logosu için sipariş notunda belirtin, +%15 ek ücretle uygulanır." },
  ],
  relatedSlugs: ["kapakli-bloknot", "spiralli-bloknot", "kup-bloknot"],
  parameters: [
    buildMatrix({
      label: "Ebat × Cilt",
      matrixNote: "50'lik Tutkallı · 80 gr 1.Hamur · Kapaksız · Alt karton baskısız",
      rows: [
        { id: "9-13", label: "B28 — 9.4×13.3 cm", sublabel: "9.4 × 13.3 cm", code: "B28", prices: { "500": 5625, "1000": 8125 } },
        { id: "14-20", label: "B29 — 14×20 cm", sublabel: "14 × 20 cm", code: "B29", prices: { "500": 8125, "1000": 13750 } },
      ],
      cols: [
        { id: "500", label: "500 Cilt" },
        { id: "1000", label: "1.000 Cilt" },
      ],
      defaultRowId: "9-13",
      defaultColId: "500",
    }),
  ],
  seo: {
    title: "Kapaksız Bloknot — 50'lik Tutkallı, 5.625 TL'den",
    description: "En ekonomik kapaksız tutkallı bloknot, 9.4×13.3 / 14×20 cm × 500/1.000 cilt. 80 gr 1.Hamur tek renk, alt karton baskısız.",
    keywords: ["kapaksız bloknot", "tutkallı bloknot", "ekonomik bloknot", "50'lik bloknot"],
  },
};

// ============================================================================
// 22. NOTLUK — 7.8×14 cm 70'lik
// ============================================================================
const notluk: ProductWithParams = {
  slug: "notluk",
  name: "Notluk — 7.8×14 cm 70'lik",
  categorySlug: "bloknot",
  sku: "MK-NTK-78",
  brand: "Markala",
  shortDescription: "70 yapraklık cep notluk — iç 110 gr renkli, dış 350 gr Mat Selefon",
  description: note(
    "Cep, ceket iç cebi ya da çanta için 7.8×14 cm 70 yapraklık premium notluk. İç yapraklar 110 gr 1.Hamur renkli baskı (kişiye/kuruma özel tasarım); dış kapak 350 gr Amerikan Bristol Mat Selefon premium koruma. Tek varyant, sabit 1.000 adet paket.",
  ),
  basePrice: 0,
  startingPrice: 15625,
  sizeLabel: "7.8×14 cm · 70 yaprak · İç 110 gr renkli + Dış 350 gr Mat Selefon",
  productionTime: "5-7 iş günü",
  images: [prodImg("notluk", 1)],
  badges: ["yeni"],
  rating: { average: 4.8, count: 5 },
  features: [
    "7.8×14 cm cep boyu",
    "70 yaprak (35 sayfa çift yön)",
    "İç yaprak: 110 gr 1.Hamur renkli baskı",
    "Dış kapak: 350 gr Amerikan Bristol Mat Selefon",
    "Premium kurumsal hediye",
  ],
  useCases: [
    "Yöneticiye/CEO'ya kurumsal hediye",
    "Yılbaşı ve kuruluş yıldönümü",
    "VIP müşteri promosyonu",
    "Kurumsal eğitim katılımcı seti",
  ],
  specifications: [
    { label: "Ebat", value: "7.8 × 14 cm" },
    { label: "Yaprak Sayısı", value: "70" },
    { label: "İç Yaprak", value: "110 gr 1.Hamur Renkli Baskı" },
    { label: "Dış Kapak", value: "350 gr Amerikan Bristol Mat Selefon" },
    { label: "Üretim Süresi", value: "5-7 iş günü" },
  ],
  faqs: [
    { q: "Tasarım için ne göndermeliyim?", a: "İç yaprak için tek tasarım (her sayfada aynı), dış kapak için ön ve arka tasarım — CMYK 300 dpi PDF." },
  ],
  relatedSlugs: ["kapakli-bloknot", "kup-bloknot", "spiralli-bloknot"],
  parameters: [
    buildMatrix({
      label: "Adet",
      matrixNote: "İç 110 gr Renkli + Dış 350 gr Mat Selefon · 1.000 adet sabit",
      rows: [
        { id: "notluk", label: "Notluk 7.8×14 cm 70'lik", sublabel: "İç 110 gr renkli + Dış 350 gr Mat Selefon", code: "NTK", prices: { "1000": 15625 } },
      ],
      cols: [{ id: "1000", label: "1.000 Adet" }],
    }),
  ],
  seo: {
    title: "Notluk — 7.8×14 cm 70'lik Premium, 15.625 TL",
    description: "Cep notluk 7.8×14 cm 70 yaprak, iç 110 gr renkli + dış 350 gr Mat Selefon. Kurumsal premium hediye, 1.000 adet.",
    keywords: ["notluk", "cep notluk", "kurumsal notluk", "premium not defteri", "yöneticiye hediye"],
  },
};

// ============================================================================
// 23. ÇANTALAR — 210 gr Amerikan Bristol Selefonlu, 6 ebat × 2 adet + ekstra
// ============================================================================
const canta: ProductWithParams = {
  slug: "canta",
  name: "Çanta — 210 gr Amerikan Bristol Parlak/Mat Selefon",
  categorySlug: "canta-kese",
  sku: "MK-CNT-210",
  brand: "Markala",
  shortDescription: "Mağaza/promosyon çantası — 6 ebat, ip rengi seçimi, lak ekstraları",
  description: note(
    "Mağaza, butik, hediye paketleme, etkinlik dağıtım için 210 gr Amerikan Bristol kâğıttan parlak veya mat selefonlu çantalar; 6 ebat × 2 adet bandı (500/1.000) + her ek 1.000 adet için indirimli kademe. Ekstralar: Normal Lak (+1.250-1.600 TL), Kabartma Lak (+1.500-2.250 TL), Özel Desen (+2.500-5.000 TL). Çanta ipinin rengi 29 farklı kod (201-229) arasından seçilir.\n\n**Sipariş notu zorunlu:** Çanta dosyalarının içerisine **İp Kodunu** (201-229) ve **Selefon türünü** (Mat veya Parlak) belirtiniz.",
  ),
  basePrice: 0,
  startingPrice: 5300,
  sizeLabel: "210 gr A.Bristol · Parlak/Mat Selefon · 6 Ebat",
  productionTime: "5-7 iş günü",
  images: [prodImg("canta", 1)],
  badges: ["yeni"],
  rating: { average: 4.8, count: 18 },
  features: [
    "210 gr Amerikan Bristol kâğıt",
    "6 ebat (CNT1 25×37×8 / CNT1-KRAFT / CNT2 38×23×9 / CNT3 17×24×7 / CNT3-KRAFT / CNT4 51×33×13)",
    "Parlak veya Mat Selefon (sipariş notunda belirtilir)",
    "İp rengi 29 alternatif (201-229)",
    "Normal Lak / Kabartma Lak / Özel Desen ekstraları",
    "500 / 1.000 / +1.000 kademeli adet",
  ],
  useCases: [
    "Mağaza ve butik alışveriş çantası",
    "Hediye paketleme (yılbaşı, doğum günü)",
    "Etkinlik welcome bag",
    "Kongre / fuar promosyon çantası",
    "Pastane, çikolata kutusu çantası",
  ],
  specifications: [
    { label: "Kâğıt", value: "210 gr Amerikan Bristol (KRAFT varyant: 200 gr Tek Renk)" },
    { label: "Selefon", value: "Parlak veya Mat (sipariş notuyla)" },
    { label: "İp", value: "29 renk (201-229) sipariş notuyla seçilir" },
    { label: "Ebatlar", value: "CNT1 25×37×8 / CNT2 38×23×9 / CNT3 17×24×7 / CNT4 51×33×13 cm" },
    { label: "Ekstra Lak", value: "Normal Lak / Kabartma Lak / Özel Desen" },
    { label: "Üretim Süresi", value: "5-7 iş günü" },
  ],
  faqs: [
    { q: "İp rengini nasıl seçeceğim?", a: "Ürün galerisindeki 29 ip renk kataloğundan istediğinizin numarasını (201-229) sipariş notunda belirtin. Karışık renk için her ip rengini ve adedini ayrı belirtebilirsiniz." },
    { q: "Mat selefon mı yoksa parlak mı?", a: "Mat selefon premium ve sofistike görünüm, parmak izi tutmaz. Parlak selefon daha canlı renk, vitrin parıltısı. Sipariş notunda 'Mat Selefon' veya 'Parlak Selefon' yazın." },
    { q: "KRAFT ile standart farkı?", a: "CNT1-KRAFT ve CNT3-KRAFT: doğal kraft kahverengi kâğıt + tek renk baskı (siyah/koyu). Eko ve naturel görünüm tercih eden butikler için. Standart varyantlar tam renkli baskı için." },
    { q: "Lak ekstrası ne fark yaratır?", a: "Normal Lak: yüzeyde pürüzsüz koruyucu kat. Kabartma Lak: belirli alanlarda 3D dokunsal kabartma efekti, lüks. Özel Desen: 3D desenli kabartma (örn. damalı, dokulu)." },
  ],
  relatedSlugs: ["kapi-aski-brosur", "kapakli-bloknot", "klasik-kartvizit"],
  parameters: [
    buildMatrix({
      label: "Ebat × Adet",
      matrixNote: "210 gr A.Bristol Parlak/Mat Selefon — Lak ekstraları 'Sipariş Notu' alanında belirtilir",
      rows: [
        { id: "cnt1", label: "CNT1", sublabel: "25 × 37 × 8 cm · Selefonlu", code: "CNT1", prices: { "500": 8750, "1000": 13750, "2000": 25625 } },
        { id: "cnt1-kraft", label: "CNT1-KRAFT", sublabel: "25×37×8 cm · 200 gr KRAFT Tek Renk", code: "CNT1-KRAFT", prices: { "500": 5950, "1000": 9625, "2000": 18125 } },
        { id: "cnt2", label: "CNT2", sublabel: "38 × 23 × 9 cm · Selefonlu", code: "CNT2", prices: { "500": 10625, "1000": 15625, "2000": 30000 } },
        { id: "cnt3", label: "CNT3", sublabel: "17 × 24 × 7 cm · Selefonlu", code: "CNT3", prices: { "500": 7500, "1000": 10950, "2000": 19075 } },
        { id: "cnt3-kraft", label: "CNT3-KRAFT", sublabel: "17×24×7 cm · 200 gr KRAFT Tek Renk", code: "CNT3-KRAFT", prices: { "500": 5300, "1000": 8125, "2000": 15000 } },
        { id: "cnt4", label: "CNT4", sublabel: "51 × 33 × 13 cm · Selefonlu", code: "CNT4", prices: { "500": 12500, "1000": 21250, "2000": 40625 } },
      ],
      cols: [
        { id: "500", label: "500 Adet" },
        { id: "1000", label: "1.000 Adet" },
        { id: "2000", label: "2.000 Adet", sublabel: "+1.000 ek tarifeli" },
      ],
      defaultRowId: "cnt1",
      defaultColId: "1000",
    }),
  ],
  seo: {
    title: "Çanta Baskı — 210 gr Bristol Selefonlu, 6 Ebat 5.300 TL'den",
    description: "Mağaza ve promosyon kâğıt çantaları — 210 gr Amerikan Bristol parlak/mat selefon, 6 ebat, 29 ip renk seçeneği. Lak ve özel desen ekstraları.",
    keywords: ["kağıt çanta", "mağaza çantası", "butik çanta", "promosyon çanta", "selefonlu çanta", "kurumsal çanta", "kraft çanta"],
  },
};

export const matbaaProducts3: ProductWithParams[] = [
  etiket,
  makbuz,
  otoPaspas,
  kupBloknot,
  spiralliBloknot,
  kapakliBloknot,
  kapaksizBloknot,
  notluk,
  canta,
];
