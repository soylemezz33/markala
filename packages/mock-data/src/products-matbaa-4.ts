import type { MatrixCell } from "@markala/types";
import type { ProductWithParams, ProductParameter, ParameterKind } from "./legacy-types";
import { PRODUCTION_TOLERANCE_PARAGRAPH } from "./notes";

const prodImg = (slug: string, i: number = 1) =>
  `/api/mockup?slug=${slug}&v=${i}&w=1200&h=1200`;
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
      cells.push({ id: `${r.id}-${c.id}`, rowId: r.id, colId: c.id, code: r.code, price });
    }
  }
  const dRow = args.defaultRowId ?? args.rows[0]?.id ?? "";
  const dCol = args.defaultColId ?? args.cols[0]?.id ?? "";
  return {
    id: args.id ?? "varyant",
    label: args.label ?? "Varyant × Adet",
    kind: "matrix" as ParameterKind,
    required: true,
    matrixNote: args.matrixNote,
    rows: args.rows.map(({ id, label, sublabel, group }) => ({ id, label, sublabel, group })),
    cols: args.cols,
    cells,
    defaultCellId: `${dRow}-${dCol}`,
  };
}

// ─── KATALOG ─────────────────────────────────────────────────────────────────

const katalogSaddle = {
  slug: "katalog-saddle",
  name: "Saddle-Stitch Katalog",
  categorySlug: "katalog",
  basePrice: 0,
  productionTime: "5-7 iş günü",
  shortDescription: "Tel dikiş ciltli profesyonel ürün kataloğu, 20–64 sayfa seçeneği.",
  description: note(
    "Ürünlerinizi ve hizmetlerinizi en etkileyici biçimde sunan tel dikiş (saddle-stitch) katalog baskısı. " +
    "Parlak veya mat kuşe kağıda, tam renkli baskı. 4 sayfa katları hâlinde sayfa sayısı belirlenir."
  ),
  imageUrl: prodImg("katalog-saddle"),
  images: [prodImg("katalog-saddle", 1), prodImg("katalog-saddle", 2)],
  accentColor: "#4B3AA0",
  parameters: [
    buildMatrix({
      id: "boyut-adet",
      label: "Boyut × Adet",
      matrixNote: "Fiyatlar KDV dahildir. Sayfa sayısı 4''ün katı olmalıdır.",
      rows: [
        { id: "a4-20", label: "A4 — 20 Sayfa", prices: { "100": 3500, "250": 5800, "500": 9200, "1000": 15000 } },
        { id: "a4-32", label: "A4 — 32 Sayfa", prices: { "100": 4800, "250": 7500, "500": 12500, "1000": 21000 } },
        { id: "a4-48", label: "A4 — 48 Sayfa", prices: { "100": 6200, "250": 9800, "500": 16500, "1000": 28000 } },
        { id: "a4-64", label: "A4 — 64 Sayfa", prices: { "100": 7800, "250": 12500, "500": 20000, "1000": 34000 } },
        { id: "a5-20", label: "A5 — 20 Sayfa", prices: { "100": 2400, "250": 3900, "500": 6200, "1000": 10200 } },
        { id: "a5-32", label: "A5 — 32 Sayfa", prices: { "100": 3200, "250": 5100, "500": 8500, "1000": 14000 } },
        { id: "a5-48", label: "A5 — 48 Sayfa", prices: { "100": 4300, "250": 6800, "500": 11000, "1000": 19000 } },
      ],
      cols: [
        { id: "100", label: "100 Adet" },
        { id: "250", label: "250 Adet" },
        { id: "500", label: "500 Adet" },
        { id: "1000", label: "1.000 Adet" },
      ],
    }),
    {
      id: "kapak-kaplama",
      label: "Kapak Kaplama",
      kind: "radio" as ParameterKind,
      required: true,
      defaultOptionId: "mat-selefon",
      options: [
        { id: "mat-selefon", label: "Mat Selefon", priceModifier: 0 },
        { id: "parlak-selefon", label: "Parlak Selefon", priceModifier: 0 },
        { id: "lak-uv", label: "Nokta Lak (UV)", priceModifier: 350 },
      ],
    },
    {
      id: "ic-kagit",
      label: "İç Kağıt Gramajı",
      kind: "radio" as ParameterKind,
      required: true,
      defaultOptionId: "115gr",
      options: [
        { id: "115gr", label: "115 gr Kuşe", priceModifier: 0 },
        { id: "135gr", label: "135 gr Kuşe", priceModifier: 250 },
      ],
    },
  ],
};

const katalogPerfect = {
  slug: "katalog-perfect",
  name: "Perfect Binding Katalog",
  categorySlug: "katalog",
  basePrice: 0,
  productionTime: "5-7 iş günü",
  shortDescription: "Sırt yapıştırmalı ciltsiz katalog, 48–200 sayfa arası seçenek.",
  description: note(
    "Kapsamlı ürün katalogları ve kurumsal tanıtım kitapçıkları için perfect binding cilt. " +
    "Güçlü sırt yapışması sayesinde sayfalar dağılmaz; profesyonel kitap görünümü sunar."
  ),
  imageUrl: prodImg("katalog-perfect"),
  images: [prodImg("katalog-perfect", 1), prodImg("katalog-perfect", 2)],
  accentColor: "#4B3AA0",
  parameters: [
    buildMatrix({
      id: "sayfa-adet",
      label: "Sayfa Sayısı × Adet",
      matrixNote: "Minimum 48 sayfa. İç sayfa 4''ün katı olmalıdır.",
      rows: [
        { id: "48s", label: "48 Sayfa", prices: { "100": 5200, "250": 8200, "500": 13500 } },
        { id: "64s", label: "64 Sayfa", prices: { "100": 6500, "250": 10500, "500": 17000 } },
        { id: "80s", label: "80 Sayfa", prices: { "100": 8000, "250": 13000, "500": 21000 } },
        { id: "100s", label: "100 Sayfa", prices: { "100": 10000, "250": 16000, "500": 26000 } },
        { id: "120s", label: "120 Sayfa", prices: { "100": 12000, "250": 19500, "500": 31000 } },
      ],
      cols: [
        { id: "100", label: "100 Adet" },
        { id: "250", label: "250 Adet" },
        { id: "500", label: "500 Adet" },
      ],
    }),
    {
      id: "kapak",
      label: "Kapak Kalınlığı",
      kind: "radio" as ParameterKind,
      required: true,
      defaultOptionId: "300gr",
      options: [
        { id: "300gr", label: "300 gr Kuşe Kapak", priceModifier: 0 },
        { id: "350gr", label: "350 gr Kuşe Kapak", priceModifier: 200 },
      ],
    },
  ],
};

// ─── TAKVİM ──────────────────────────────────────────────────────────────────

const duvarTakvimi = {
  slug: "duvar-takvimi",
  name: "Duvar Takvimi",
  categorySlug: "takvim",
  basePrice: 0,
  productionTime: "7-10 iş günü",
  shortDescription: "13 yapraklı spiral ciltli duvar takvimi, A3 veya A2 boyut seçeneği.",
  description: note(
    "Kurumsal hediye ve tanıtım için ideal duvar takvimi. Her ay için ayrı sayfa, spiral cilt ve " +
    "metal askı aparatı dahil. Baskı: tam renk, mat/parlak selefon kapak."
  ),
  imageUrl: prodImg("duvar-takvimi"),
  images: [prodImg("duvar-takvimi", 1), prodImg("duvar-takvimi", 2)],
  accentColor: "#4B3AA0",
  parameters: [
    buildMatrix({
      id: "boyut-adet",
      label: "Boyut × Adet",
      matrixNote: "13 yaprak (kapak + 12 ay). Metal askı aparatı dahil.",
      rows: [
        { id: "a3", label: "A3 (30×42 cm)", prices: { "100": 5500, "250": 8500, "500": 14000, "1000": 24000 } },
        { id: "a2", label: "A2 (42×60 cm)", prices: { "100": 8500, "250": 14000, "500": 23000, "1000": 40000 } },
      ],
      cols: [
        { id: "100", label: "100 Adet" },
        { id: "250", label: "250 Adet" },
        { id: "500", label: "500 Adet" },
        { id: "1000", label: "1.000 Adet" },
      ],
    }),
    {
      id: "kaplama",
      label: "Yüzey Kaplama",
      kind: "radio" as ParameterKind,
      required: true,
      defaultOptionId: "mat",
      options: [
        { id: "mat", label: "Mat Selefon", priceModifier: 0 },
        { id: "parlak", label: "Parlak Selefon", priceModifier: 0 },
      ],
    },
  ],
};

const masaTakvimi = {
  slug: "masa-takvimi",
  name: "Masa Takvimi",
  categorySlug: "takvim",
  basePrice: 0,
  productionTime: "7-10 iş günü",
  shortDescription: "Ayaklı spiral masa takvimi, 13 yaprak, 21×10 cm standart boyut.",
  description: note(
    "Masastü kullanım için çift taraflı ayaklı masa takvimi. Spiral cilt, karton arka destek ve " +
    "her ay için özel tasarım. Kurumsal logo ve bilgilerinizle kişisel leştirin."
  ),
  imageUrl: prodImg("masa-takvimi"),
  images: [prodImg("masa-takvimi", 1), prodImg("masa-takvimi", 2)],
  accentColor: "#4B3AA0",
  parameters: [
    buildMatrix({
      id: "adet",
      label: "Adet",
      rows: [
        { id: "std", label: "21×10 cm", prices: { "250": 5500, "500": 8500, "1000": 14500, "2500": 28000 } },
      ],
      cols: [
        { id: "250", label: "250 Adet" },
        { id: "500", label: "500 Adet" },
        { id: "1000", label: "1.000 Adet" },
        { id: "2500", label: "2.500 Adet" },
      ],
    }),
  ],
};

// ─── DAVETİYE ────────────────────────────────────────────────────────────────

const dugumDavetiyesi = {
  slug: "dugum-davetiyesi",
  name: "Dügün Davetiyesi",
  categorySlug: "davetiye",
  basePrice: 0,
  productionTime: "3-5 iş günü",
  shortDescription: "Özel tasarım dügün davetiyesi, zarflı, 350 gr baskı.",
  description: note(
    "Unutulmaz dügününüz için özel tasarım davetiye baskısı. 350 gr kart üzerine tam renk, " +
    "mat veya parlak selefon seçeneği. Zarf dahil."
  ),
  imageUrl: prodImg("dugum-davetiyesi"),
  images: [prodImg("dugum-davetiyesi", 1), prodImg("dugum-davetiyesi", 2)],
  accentColor: "#FFB91C",
  parameters: [
    buildMatrix({
      id: "boyut-adet",
      label: "Boyut × Adet",
      rows: [
        { id: "a6", label: "A6 (10.5×14.8 cm)", prices: { "100": 1850, "250": 3200, "500": 5500, "1000": 9500 } },
        { id: "13x18", label: "13×18 cm", prices: { "100": 2200, "250": 3800, "500": 6500, "1000": 11000 } },
        { id: "kare", label: "15×15 cm Kare", prices: { "100": 2500, "250": 4200, "500": 7200, "1000": 12500 } },
      ],
      cols: [
        { id: "100", label: "100 Adet" },
        { id: "250", label: "250 Adet" },
        { id: "500", label: "500 Adet" },
        { id: "1000", label: "1.000 Adet" },
      ],
    }),
    {
      id: "kaplama",
      label: "Yüzey Kaplama",
      kind: "radio" as ParameterKind,
      required: true,
      defaultOptionId: "mat",
      options: [
        { id: "mat", label: "Mat Selefon", priceModifier: 0 },
        { id: "parlak", label: "Parlak Selefon", priceModifier: 0 },
        { id: "kadife", label: "Soft-Touch (Kadife)", priceModifier: 450 },
      ],
    },
  ],
};

const kurumsalDavetiye = {
  slug: "kurumsal-davetiye",
  name: "Kurumsal Davetiye",
  categorySlug: "davetiye",
  basePrice: 0,
  productionTime: "3-5 iş günü",
  shortDescription: "Açılış, toplantı ve etkinlikler için kurumsal davetiye.",
  description: note(
    "Şirket açılışları, lansman etkinlikleri ve kurumsal toplantılar için şik davetiye baskısı. " +
    "Logonuz ve kurumsal renklerinizle özel tasarım. Zarf ve isim yazımı seçeneği mevcut."
  ),
  imageUrl: prodImg("kurumsal-davetiye"),
  images: [prodImg("kurumsal-davetiye", 1), prodImg("kurumsal-davetiye", 2)],
  accentColor: "#4B3AA0",
  parameters: [
    buildMatrix({
      id: "boyut-adet",
      label: "Boyut × Adet",
      rows: [
        { id: "a5", label: "A5 (14.8×21 cm)", prices: { "100": 2200, "250": 3600, "500": 6000, "1000": 10200 } },
        { id: "a6", label: "A6 (10.5×14.8 cm)", prices: { "100": 1800, "250": 2900, "500": 4900, "1000": 8200 } },
      ],
      cols: [
        { id: "100", label: "100 Adet" },
        { id: "250", label: "250 Adet" },
        { id: "500", label: "500 Adet" },
        { id: "1000", label: "1.000 Adet" },
      ],
    }),
    {
      id: "tip",
      label: "Davetiye Tipi",
      kind: "radio" as ParameterKind,
      required: true,
      defaultOptionId: "tekli",
      options: [
        { id: "tekli", label: "Tekli Kart", priceModifier: 0 },
        { id: "katli", label: "Katlı (2'li)", priceModifier: 300 },
      ],
    },
  ],
};

// ─── PVC KART ────────────────────────────────────────────────────────────────

const pvcUyelikKarti = {
  slug: "pvc-uyelik-karti",
  name: "PVC Üyelik Kartı",
  categorySlug: "pvc-kart",
  basePrice: 0,
  productionTime: "3-5 iş günü",
  shortDescription: "Kredi kartı boyutunda, plastik PVC üyelik ve sadakat kartı.",
  description: note(
    "Markanızı her gün müşterinizin cüzdanında tutun. Standart kredi kartı boyutunda (85.6×54 mm), " +
    "760 mikron kalınlığında PVC kart baskısı. Barkod veya numara eklenebilir."
  ),
  imageUrl: prodImg("pvc-uyelik-karti"),
  images: [prodImg("pvc-uyelik-karti", 1), prodImg("pvc-uyelik-karti", 2)],
  accentColor: "#4B3AA0",
  parameters: [
    buildMatrix({
      id: "adet",
      label: "Adet Seçimi",
      rows: [
        { id: "std", label: "85.6×54 mm — 760 µ", prices: { "250": 1200, "500": 1900, "1000": 3200, "2500": 6500, "5000": 11000 } },
      ],
      cols: [
        { id: "250", label: "250 Adet" },
        { id: "500", label: "500 Adet" },
        { id: "1000", label: "1.000 Adet" },
        { id: "2500", label: "2.500 Adet" },
        { id: "5000", label: "5.000 Adet" },
      ],
    }),
    {
      id: "ekstra",
      label: "Ekstra Özellik",
      kind: "radio" as ParameterKind,
      required: true,
      defaultOptionId: "yok",
      options: [
        { id: "yok", label: "Yok", priceModifier: 0 },
        { id: "barkod", label: "Barkod / Numara Baskısı", priceModifier: 400 },
        { id: "manyetik", label: "Manyetik Şerit (HiCo)", priceModifier: 800 },
        { id: "rfid", label: "RFID Çip (13.56 MHz)", priceModifier: 1800 },
      ],
    },
  ],
};

const pvcOtelKarti = {
  slug: "pvc-otel-karti",
  name: "PVC Otel Oda Kartı",
  categorySlug: "pvc-kart",
  basePrice: 0,
  productionTime: "3-5 iş günü",
  shortDescription: "RFID/Manyetik anahtarlık otel kartı, özel baskı.",
  description: note(
    "Oteller, siteler ve ofis binaları için özel logolu elektronik kilit kartı. " +
    "RFID 13.56 MHz veya manyetik Şritli seçenek. 760 µ PVC, tam renk baskı."
  ),
  imageUrl: prodImg("pvc-otel-karti"),
  images: [prodImg("pvc-otel-karti", 1), prodImg("pvc-otel-karti", 2)],
  accentColor: "#4B3AA0",
  parameters: [
    buildMatrix({
      id: "tip-adet",
      label: "Kart Tipi × Adet",
      rows: [
        { id: "rfid", label: "RFID 13.56 MHz", prices: { "100": 2800, "250": 5200, "500": 9000, "1000": 15000 } },
        { id: "mag", label: "Manyetik Şeritli", prices: { "100": 1800, "250": 3200, "500": 5500, "1000": 9500 } },
      ],
      cols: [
        { id: "100", label: "100 Adet" },
        { id: "250", label: "250 Adet" },
        { id: "500", label: "500 Adet" },
        { id: "1000", label: "1.000 Adet" },
      ],
    }),
  ],
};

// ─── KANVAS TABLO ────────────────────────────────────────────────────────────

const kanvasTablo60x40 = {
  slug: "kanvas-tablo-60x40",
  name: "Kanvas Tablo 60×40 cm",
  categorySlug: "kanvas-tablo",
  basePrice: 0,
  productionTime: "2-3 iş günü",
  shortDescription: "60×40 cm, 380 gr kanvas tuval üzerine fotoğraf veya grafik baskısı.",
  description: note(
    "Fotoğraflarınızı veya tasarımlarınızı sanat eserine dönüştürün. 380 gr pamuk kanvas, " +
    "pigment mürekkep, solmaz UV baskı. Ahşap çıta gergi dahil, duvar askı aparatı dahil."
  ),
  imageUrl: prodImg("kanvas-tablo-60x40"),
  images: [prodImg("kanvas-tablo-60x40", 1), prodImg("kanvas-tablo-60x40", 2)],
  accentColor: "#4B3AA0",
  parameters: [
    {
      id: "adet",
      label: "Adet",
      kind: "quantity" as ParameterKind,
      required: true,
      unitPrice: 450,
      quantityPresets: [1, 2, 5, 10],
    },
    {
      id: "cerceve",
      label: "Çerçeve Seçeneği",
      kind: "radio" as ParameterKind,
      required: true,
      defaultOptionId: "gergi",
      options: [
        { id: "gergi", label: "Gergi (Kasnaklı)", priceModifier: 0 },
        { id: "siyah-cerceve", label: "Siyah Çerçeve (+Floater)", priceModifier: 250 },
        { id: "beyaz-cerceve", label: "Beyaz Çerçeve (+Floater)", priceModifier: 250 },
      ],
    },
  ],
};

const kanvasTablo100x70 = {
  slug: "kanvas-tablo-100x70",
  name: "Kanvas Tablo 100×70 cm",
  categorySlug: "kanvas-tablo",
  basePrice: 0,
  productionTime: "2-3 iş günü",
  shortDescription: "100×70 cm büyük boy kanvas, pigment baskı, gergi dahil.",
  description: note(
    "Geniş mekânlar ve showroom’lar için büyük formatlı kanvas tablo. " +
    "380 gr pamuk kanvas, UV pigment mürekkep, 3 cm derinlik ahşap kasnak."
  ),
  imageUrl: prodImg("kanvas-tablo-100x70"),
  images: [prodImg("kanvas-tablo-100x70", 1), prodImg("kanvas-tablo-100x70", 2)],
  accentColor: "#4B3AA0",
  parameters: [
    {
      id: "adet",
      label: "Adet",
      kind: "quantity" as ParameterKind,
      required: true,
      unitPrice: 980,
      quantityPresets: [1, 2, 3, 5],
    },
    {
      id: "cerceve",
      label: "Çerçeve Seçeneği",
      kind: "radio" as ParameterKind,
      required: true,
      defaultOptionId: "gergi",
      options: [
        { id: "gergi", label: "Gergi (Kasnaklı)", priceModifier: 0 },
        { id: "siyah-cerceve", label: "Siyah Floater Çerçeve", priceModifier: 450 },
      ],
    },
  ],
};

// ─── STİKER KESİMLİ ──────────────────────────────────────────────────────────

const stikerBeyazVinyl = {
  slug: "stiker-beyaz-vinyl",
  name: "Beyaz Vinyl Stiker",
  categorySlug: "stiker-kesimli",
  basePrice: 0,
  productionTime: "2-4 iş günü",
  shortDescription: "Özel şekil kesimli beyaz vinyl stiker, su geçirmez.",
  description: note(
    "Ürün ambalajı, promosyon ve dekorasyon için özel şekil kesimli beyaz vinyl stiker. " +
    "Su geçirmez, UV dayanımlı, 3–5 yıl dış mekân ömrü. Kontur kesim dahil."
  ),
  imageUrl: prodImg("stiker-beyaz-vinyl"),
  images: [prodImg("stiker-beyaz-vinyl", 1), prodImg("stiker-beyaz-vinyl", 2)],
  accentColor: "#4B3AA0",
  parameters: [
    buildMatrix({
      id: "boyut-adet",
      label: "Boyut × Adet",
      matrixNote: "Maksimum boyut: 30×20 cm. Daha büyük boyutlar için teklif alın.",
      rows: [
        { id: "kucuk", label: "Küçük (5×5 cm'e kadar)", prices: { "50": 450, "100": 750, "250": 1500, "500": 2600 } },
        { id: "orta", label: "Orta (10×10 cm'e kadar)", prices: { "50": 650, "100": 1100, "250": 2200, "500": 3900 } },
        { id: "buyuk", label: "Büyük (15×15 cm'e kadar)", prices: { "50": 950, "100": 1600, "250": 3200, "500": 5500 } },
        { id: "xlarge", label: "XL (20×20 cm'e kadar)", prices: { "50": 1350, "100": 2200, "250": 4300, "500": 7500 } },
      ],
      cols: [
        { id: "50", label: "50 Adet" },
        { id: "100", label: "100 Adet" },
        { id: "250", label: "250 Adet" },
        { id: "500", label: "500 Adet" },
      ],
    }),
    {
      id: "finish",
      label: "Yüzey",
      kind: "radio" as ParameterKind,
      required: true,
      defaultOptionId: "parlak",
      options: [
        { id: "parlak", label: "Parlak", priceModifier: 0 },
        { id: "mat", label: "Mat", priceModifier: 0 },
      ],
    },
  ],
};

const stikerSeffafVinyl = {
  slug: "stiker-seffaf-vinyl",
  name: "Şeffaf Vinyl Stiker",
  categorySlug: "stiker-kesimli",
  basePrice: 0,
  productionTime: "2-4 iş günü",
  shortDescription: "Görünmez arka zeminli şeffaf vinyl stiker, kontur kesimli.",
  description: note(
    "Arka zemini görünmez olan şeffaf vinyl stiker; cam, plastik ve parlak yüzeyler için ideal. " +
    "Özellikle içecek şişesi ve kozmetik ambalajında etiket olarak kullanılır. Kontur kesim dahil."
  ),
  imageUrl: prodImg("stiker-seffaf-vinyl"),
  images: [prodImg("stiker-seffaf-vinyl", 1), prodImg("stiker-seffaf-vinyl", 2)],
  accentColor: "#4B3AA0",
  parameters: [
    buildMatrix({
      id: "boyut-adet",
      label: "Boyut × Adet",
      rows: [
        { id: "kucuk", label: "Küçük (5×5 cm'e kadar)", prices: { "50": 520, "100": 880, "250": 1750, "500": 3000 } },
        { id: "orta", label: "Orta (10×10 cm'e kadar)", prices: { "50": 750, "100": 1280, "250": 2550, "500": 4400 } },
        { id: "buyuk", label: "Büyük (15×15 cm'e kadar)", prices: { "50": 1100, "100": 1850, "250": 3700, "500": 6400 } },
      ],
      cols: [
        { id: "50", label: "50 Adet" },
        { id: "100", label: "100 Adet" },
        { id: "250", label: "250 Adet" },
        { id: "500", label: "500 Adet" },
      ],
    }),
  ],
};

// ─── LANYARD ─────────────────────────────────────────────────────────────────

const lanyard15mm = {
  slug: "lanyard-15mm",
  name: "Lanyard 15mm Sublimasyón",
  categorySlug: "lanyard",
  basePrice: 0,
  productionTime: "5-7 iş günü",
  shortDescription: "15 mm genişliğinde polyester boyun ipi, klipsli, tam baskı.",
  description: note(
    "Fuar, kongre ve kurum kimliği için logolu boyun ipi (lanyard). " +
    "Polyester dokuma, sublimasyón baskı, metal veya plastik klips dahil. " +
    "15 mm genişlik, boyut: yaklaşık 90 cm (çift kol)."
  ),
  imageUrl: prodImg("lanyard-15mm"),
  images: [prodImg("lanyard-15mm", 1), prodImg("lanyard-15mm", 2)],
  accentColor: "#4B3AA0",
  parameters: [
    buildMatrix({
      id: "klips-adet",
      label: "Klips Tipi × Adet",
      rows: [
        { id: "kanca", label: "Metal Karabina Kanca", prices: { "100": 1200, "250": 2300, "500": 4000, "1000": 7000 } },
        { id: "plastik", label: "Plastik Kanca", prices: { "100": 1100, "250": 2100, "500": 3600, "1000": 6200 } },
        { id: "guvenlik", label: "Güvenlik Kırılma Noktası + Kanca", prices: { "100": 1450, "250": 2700, "500": 4700, "1000": 8200 } },
      ],
      cols: [
        { id: "100", label: "100 Adet" },
        { id: "250", label: "250 Adet" },
        { id: "500", label: "500 Adet" },
        { id: "1000", label: "1.000 Adet" },
      ],
    }),
  ],
};

const lanyard10mm = {
  slug: "lanyard-10mm",
  name: "Lanyard 10mm İnce",
  categorySlug: "lanyard",
  basePrice: 0,
  productionTime: "5-7 iş günü",
  shortDescription: "10 mm ince polyester boyun ipi, karabinalı, tek renk baskı.",
  description: note(
    "Şik ve ince profilli 10 mm lanyard. Tek renk veya sublimasyón baskı. " +
    "Karabina kanca dahil. Fuarlar, yaka kartı sistemleri ve etkinlikler için uygundur."
  ),
  imageUrl: prodImg("lanyard-10mm"),
  images: [prodImg("lanyard-10mm", 1), prodImg("lanyard-10mm", 2)],
  accentColor: "#4B3AA0",
  parameters: [
    buildMatrix({
      id: "baski-adet",
      label: "Baskı Tipi × Adet",
      rows: [
        { id: "tek-renk", label: "Tek Renk Serigrafi", prices: { "100": 980, "250": 1850, "500": 3200, "1000": 5500 } },
        { id: "sublim", label: "Sublimasyón (Tam Renk)", prices: { "100": 1200, "250": 2300, "500": 4000, "1000": 7000 } },
      ],
      cols: [
        { id: "100", label: "100 Adet" },
        { id: "250", label: "250 Adet" },
        { id: "500", label: "500 Adet" },
        { id: "1000", label: "1.000 Adet" },
      ],
    }),
  ],
};

// ─── KRAFT TORBA ─────────────────────────────────────────────────────────────

const kraftTorbaBaskili = {
  slug: "kraft-torba-baskili",
  name: "Baskılı Kraft Torba",
  categorySlug: "kraft-torba",
  basePrice: 0,
  productionTime: "5-7 iş günü",
  shortDescription: "Logolu kraft kağıt torba, ip saplı, 3 boyut seçeneği.",
  description: note(
    "Mağaza ve markalar için özel logolu kraft kağıt torba. Kahverengi veya beyaz kraft, " +
    "twisted ip sap, düz veya kabartma baskı. Çevre dostu ve geri dönüştürülebilir."
  ),
  imageUrl: prodImg("kraft-torba-baskili"),
  images: [prodImg("kraft-torba-baskili", 1), prodImg("kraft-torba-baskili", 2)],
  accentColor: "#4B3AA0",
  parameters: [
    buildMatrix({
      id: "boyut-adet",
      label: "Boyut × Adet",
      matrixNote: "Minimum sipariş: 100 adet.",
      rows: [
        { id: "s", label: "S — 18×8×22 cm", prices: { "100": 1400, "250": 2600, "500": 4500, "1000": 7800 } },
        { id: "m", label: "M — 24×10×28 cm", prices: { "100": 1800, "250": 3300, "500": 5800, "1000": 10200 } },
        { id: "l", label: "L — 32×12×36 cm", prices: { "100": 2400, "250": 4400, "500": 7600, "1000": 13500 } },
        { id: "xl", label: "XL — 40×14×45 cm", prices: { "100": 3200, "250": 5900, "500": 10200, "1000": 18000 } },
      ],
      cols: [
        { id: "100", label: "100 Adet" },
        { id: "250", label: "250 Adet" },
        { id: "500", label: "500 Adet" },
        { id: "1000", label: "1.000 Adet" },
      ],
    }),
    {
      id: "kraft-renk",
      label: "Kraft Rengi",
      kind: "radio" as ParameterKind,
      required: true,
      defaultOptionId: "kahve",
      options: [
        { id: "kahve", label: "Doğal Kahve Kraft", priceModifier: 0 },
        { id: "beyaz", label: "Beyaz Kraft", priceModifier: 200 },
      ],
    },
  ],
};

const kraftTorbaSade = {
  slug: "kraft-torba-sade",
  name: "Sade Kraft Torba (Stok)",
  categorySlug: "kraft-torba",
  basePrice: 0,
  productionTime: "5-7 iş günü",
  shortDescription: "Baskısız hazır stok kraft torba, hızlı teslimat.",
  description: note(
    "Acil ihtiyaçlar için hazır stok sade kraft torba. Logosuz, kahverengi kraft kağıt, " +
    "ip saplı. Hızlı teslimat (1–2 iş günü). Baskılı alternatifiniz için 'Baskılı Kraft Torba'ya bakın."
  ),
  imageUrl: prodImg("kraft-torba-sade"),
  images: [prodImg("kraft-torba-sade", 1)],
  accentColor: "#4B3AA0",
  parameters: [
    buildMatrix({
      id: "boyut-adet",
      label: "Boyut × Adet",
      rows: [
        { id: "s", label: "S — 18×8×22 cm", prices: { "100": 680, "250": 1200, "500": 2100, "1000": 3500 } },
        { id: "m", label: "M — 24×10×28 cm", prices: { "100": 900, "250": 1600, "500": 2800, "1000": 4800 } },
        { id: "l", label: "L — 32×12×36 cm", prices: { "100": 1200, "250": 2100, "500": 3700, "1000": 6500 } },
      ],
      cols: [
        { id: "100", label: "100 Adet" },
        { id: "250", label: "250 Adet" },
        { id: "500", label: "500 Adet" },
        { id: "1000", label: "1.000 Adet" },
      ],
    }),
  ],
};

// ─── YAKA KARTI ──────────────────────────────────────────────────────────────

const yakaKartiStandart = {
  slug: "yaka-karti-standart",
  name: "Standart Yaka Kartı",
  categorySlug: "yaka-karti",
  basePrice: 0,
  productionTime: "3-5 iş günü",
  shortDescription: "Plastik kılıflı karton yaka kartı, 85×54 mm veya 90×60 mm.",
  description: note(
    "Çalışan kimlik kartları, ziyaretçi kartları ve etkinlik akreditasyonu için yaka kartı. " +
    "350 gr karton baskı, şeffaf PVC kılıf ve boyun ipi veya klips dahil."
  ),
  imageUrl: prodImg("yaka-karti-standart"),
  images: [prodImg("yaka-karti-standart", 1), prodImg("yaka-karti-standart", 2)],
  accentColor: "#4B3AA0",
  parameters: [
    buildMatrix({
      id: "boyut-adet",
      label: "Boyut × Adet",
      rows: [
        { id: "kredi-karti", label: "Kredi Kartı 85×54 mm", prices: { "50": 800, "100": 1400, "250": 3000, "500": 5500 } },
        { id: "90x60", label: "90×60 mm", prices: { "50": 950, "100": 1650, "250": 3500, "500": 6400 } },
        { id: "a7", label: "A7 (74×105 mm)", prices: { "50": 1100, "100": 1900, "250": 4000, "500": 7200 } },
      ],
      cols: [
        { id: "50", label: "50 Adet" },
        { id: "100", label: "100 Adet" },
        { id: "250", label: "250 Adet" },
        { id: "500", label: "500 Adet" },
      ],
    }),
    {
      id: "aksesuar",
      label: "Aksesuar",
      kind: "radio" as ParameterKind,
      required: true,
      defaultOptionId: "kilif-klips",
      options: [
        { id: "kilif-klips", label: "PVC Kılıf + Klips", priceModifier: 0 },
        { id: "kilif-ip", label: "PVC Kılıf + Lanyard (15mm)", priceModifier: 250 },
        { id: "sert-kilif", label: "Sert ABS Kılıf + Klips", priceModifier: 300 },
      ],
    },
  ],
};

const yakaKartiSert = {
  slug: "yaka-karti-sert",
  name: "Sert PVC Yaka Kartı",
  categorySlug: "yaka-karti",
  basePrice: 0,
  productionTime: "3-5 iş günü",
  shortDescription: "Kredi kartı boyutunda sert PVC yaka kartı, kılıfsız.",
  description: note(
    "PVC karton yerine doğrudan sert PVC kart üzerine çalışan kimlik kartı. " +
    "760 µ PVC, tam renk baskı, kılıf gerektirmez. Uzun ömürlü kurumsal kimlik çözümü."
  ),
  imageUrl: prodImg("yaka-karti-sert"),
  images: [prodImg("yaka-karti-sert", 1), prodImg("yaka-karti-sert", 2)],
  accentColor: "#4B3AA0",
  parameters: [
    buildMatrix({
      id: "adet",
      label: "Adet",
      rows: [
        { id: "sert-pvc", label: "85.6×54 mm — 760 µ PVC", prices: { "50": 1200, "100": 2000, "250": 4200, "500": 7500 } },
      ],
      cols: [
        { id: "50", label: "50 Adet" },
        { id: "100", label: "100 Adet" },
        { id: "250", label: "250 Adet" },
        { id: "500", label: "500 Adet" },
      ],
    }),
    {
      id: "klips",
      label: "Aksesuar",
      kind: "radio" as ParameterKind,
      required: true,
      defaultOptionId: "klips",
      options: [
        { id: "klips", label: "Yaka Klipsi", priceModifier: 0 },
        { id: "lanyard", label: "Lanyard 15mm", priceModifier: 200 },
        { id: "yok", label: "Aksesuar Yok", priceModifier: -50 },
      ],
    },
  ],
};

// ─── BEZ TOTE ÇANTA ──────────────────────────────────────────────────────────

const bezTote140gr = {
  slug: "bez-tote-140gr",
  name: "Bez Tote Çanta 140gr",
  categorySlug: "bez-tote",
  basePrice: 0,
  productionTime: "7-10 iş günü",
  shortDescription: "140 gr ham bez tote çanta, serigrafi veya dijital baskı.",
  description: note(
    "Promosyon ve alışveriş için ekonomik ham bez çanta. 140 gr doğal ham bez, " +
    "uzun ip sap (65 cm), serigrafi veya dijital transfer baskı. Çevre dostu."
  ),
  imageUrl: prodImg("bez-tote-140gr"),
  images: [prodImg("bez-tote-140gr", 1), prodImg("bez-tote-140gr", 2)],
  accentColor: "#4B3AA0",
  parameters: [
    buildMatrix({
      id: "baski-adet",
      label: "Baskı × Adet",
      matrixNote: "Boyut: 38×42 cm. Serigrafi tek yüz 1 renk.",
      rows: [
        { id: "serigrafi", label: "Serigrafi (1 Renk, 1 Yüz)", prices: { "100": 5500, "250": 9500, "500": 16000, "1000": 28000 } },
        { id: "dijital", label: "Dijital Transfer (Tam Renk)", prices: { "100": 6800, "250": 12000, "500": 20000, "1000": 35000 } },
      ],
      cols: [
        { id: "100", label: "100 Adet" },
        { id: "250", label: "250 Adet" },
        { id: "500", label: "500 Adet" },
        { id: "1000", label: "1.000 Adet" },
      ],
    }),
  ],
};

const bezToteCanvas180gr = {
  slug: "bez-tote-canvas-180gr",
  name: "Canvas Tote Çanta 180gr",
  categorySlug: "bez-tote",
  basePrice: 0,
  productionTime: "7-10 iş günü",
  shortDescription: "180 gr canvas bez çanta, kalın kumaş, premium hissiyat.",
  description: note(
    "Premium kumaş dokusunda 180 gr canvas tote çanta. Alışveriş, hediye ve kurumsal " +
    "promosyon için ideal. Doğal beyaz veya naturel renk, güçlü ip sap, sublimasyónla tam renk baskı."
  ),
  imageUrl: prodImg("bez-tote-canvas-180gr"),
  images: [prodImg("bez-tote-canvas-180gr", 1), prodImg("bez-tote-canvas-180gr", 2)],
  accentColor: "#4B3AA0",
  parameters: [
    buildMatrix({
      id: "baski-adet",
      label: "Baskı × Adet",
      matrixNote: "Boyut: 38×42 cm veya 40×45 cm (seçimle).",
      rows: [
        { id: "serigrafi-1", label: "Serigrafi 1 Renk", prices: { "100": 7500, "250": 13000, "500": 22000, "1000": 38000 } },
        { id: "serigrafi-4", label: "Serigrafi 4 Renk", prices: { "100": 9500, "250": 16500, "500": 28000, "1000": 48000 } },
        { id: "sublim", label: "Sublimasyón (Tam Renk)", prices: { "100": 11000, "250": 19000, "500": 33000, "1000": 57000 } },
      ],
      cols: [
        { id: "100", label: "100 Adet" },
        { id: "250", label: "250 Adet" },
        { id: "500", label: "500 Adet" },
        { id: "1000", label: "1.000 Adet" },
      ],
    }),
    {
      id: "boyut",
      label: "Çanta Boyutu",
      kind: "radio" as ParameterKind,
      required: true,
      defaultOptionId: "38x42",
      options: [
        { id: "38x42", label: "38×42 cm", priceModifier: 0 },
        { id: "40x45", label: "40×45 cm", priceModifier: 800 },
      ],
    },
  ],
};

// ─── EXPORT ──────────────────────────────────────────────────────────────────

export const matbaaProducts4: ProductWithParams[] = [
  katalogSaddle,
  katalogPerfect,
  duvarTakvimi,
  masaTakvimi,
  dugumDavetiyesi,
  kurumsalDavetiye,
  pvcUyelikKarti,
  pvcOtelKarti,
  kanvasTablo60x40,
  kanvasTablo100x70,
  stikerBeyazVinyl,
  stikerSeffafVinyl,
  lanyard15mm,
  lanyard10mm,
  kraftTorbaBaskili,
  kraftTorbaSade,
  yakaKartiStandart,
  yakaKartiSert,
  bezTote140gr,
  bezToteCanvas180gr,
];
