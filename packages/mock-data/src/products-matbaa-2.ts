import type { Product, ProductParameter, MatrixCell } from "@markala/types";
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

// ============================================================================
// 7. ANTETLI KAĞIT — 90 gr 1.Hamur Tek Yön Renkli, A5 ve A4
// ============================================================================
const antetliKagit: Product = {
  slug: "antetli-kagit",
  name: "Antetli Kağıt — 90 gr 1.Hamur",
  categorySlug: "antetli-kagit",
  sku: "MK-ANT-90",
  brand: "Markala",
  shortDescription: "90 gr 1.Hamur Tek Yön Renkli — A5 ve A4 ebat, 2.000-12.000 adet",
  description: note(
    "Kurumsal yazışma, fatura üst yazısı, resmi mektup, resmi belge ve yönetim toplantı evrakı için 90 gr 1.Hamur kâğıt üzerine tek yön renkli baskı. A5 (15×21 cm) ve A4 (21×29.7 cm) standart boyutlar; 2.000'den başlayıp 12.000 adete kadar avantajlı kademe. Logonuz, adres ve iletişim bilgileriniz CMYK 300 dpi PDF gönderilen tasarımdan basılır.",
  ),
  basePrice: 0,
  startingPrice: 1550,
  sizeLabel: "90 gr 1.Hamur · Tek Yön Renkli · A5 / A4",
  productionTime: "1-2 iş günü",
  images: [prodImg("antetli-kagit", 1)],
  badges: ["cok-satilan"],
  rating: { average: 4.7, count: 64 },
  features: [
    "90 gr 1.Hamur kâğıt — kurumsal antet için ideal",
    "Tek yön renkli (4+0) baskı",
    "A5 (15×21 cm) ve A4 (21×29.7 cm) standart ebatlar",
    "2.000-12.000 adet kademeli fiyat",
  ],
  useCases: [
    "Kurumsal yazışma ve resmi mektup",
    "Fatura üst yazısı, dekont kapağı",
    "Resmi belge, ihale evrakı, sözleşme kapağı",
    "Yönetim toplantı evrak takımı",
  ],
  specifications: [
    { label: "Kâğıt", value: "90 gr 1.Hamur" },
    { label: "Baskı", value: "Tek Yön Renkli (4+0)" },
    { label: "Ebatlar", value: "A5 15×21 / A4 21×29.7 cm" },
    { label: "Üretim Süresi", value: "1-2 iş günü" },
  ],
  faqs: [
    { q: "Çift yön baskı yapıyor musunuz?", a: "Standart antetli tek yön içindir. Çift yön ihtiyacı için sipariş notuna ekleyin; %30 ek ücretle uygulanır." },
    { q: "Filigran (watermark) basılır mı?", a: "Filigran 1.Hamur kâğıdın yapısında olur; baskı yoluyla değil malzemenin üretiminde uygulanır. Filigranlı kâğıt için sipariş notuyla iletişime geçin, özel teklif sunalım." },
  ],
  relatedSlugs: ["zarf-diplomat-renkli", "zarf-torba", "klasik-kartvizit"],
  parameters: [
    buildMatrix({
      label: "Ebat × Adet",
      matrixNote: "90 gr 1.Hamur · Tek Yön Renkli (4+0)",
      rows: [
        { id: "a5", label: "A5", sublabel: "15 × 21 cm", prices: { "4000": 1650, "8000": 3100, "12000": 4700 } },
        { id: "a4", label: "A4", sublabel: "21 × 29.7 cm", prices: { "2000": 1550, "4000": 3000, "6000": 4400 } },
      ],
      cols: [
        { id: "2000", label: "2.000 Adet" },
        { id: "4000", label: "4.000 Adet" },
        { id: "6000", label: "6.000 Adet" },
        { id: "8000", label: "8.000 Adet" },
        { id: "12000", label: "12.000 Adet" },
      ],
      defaultRowId: "a4",
      defaultColId: "2000",
    }),
  ],
  seo: {
    title: "Antetli Kağıt Baskı — 90 gr 1.Hamur A5/A4, 1.550 TL'den",
    description: "90 gr 1.Hamur antetli kağıt baskı, A5 ve A4 ebatlarda 2.000-12.000 adet. Kurumsal yazışma, fatura üst yazısı için tek yön renkli baskı.",
    keywords: ["antetli kağıt", "antet baskı", "90 gr antetli", "kurumsal antetli", "1.hamur antetli", "fatura kağıdı", "a4 antetli"],
  },
};

// ============================================================================
// 8-10. ZARF — 110 gr 1.Hamur (3 ayrı ürün: Diplomat Tek Renk / Renkli / Torba)
// ============================================================================
const zarfDiplomatTekRenk: Product = {
  slug: "zarf-diplomat-tek-renk",
  name: "Diplomat Zarf — 10.5×24 cm Tek Renk",
  categorySlug: "zarf",
  sku: "MK-ZRF-DP-TR",
  brand: "Markala",
  shortDescription: "110 gr 1.Hamur Diplomat Zarf — Tek Renk Baskı (siyah veya tek pantone)",
  description: note(
    "Resmi yazışma, fatura, banka dekontu ve günlük kurumsal evrak için 110 gr 1.Hamur kâğıttan üretilen 10.5×24 cm Diplomat zarf, tek renk baskı (siyah veya istediğiniz tek pantone). Avrupa formatı (DL), pencereli veya penceresiz. 1.000 adetten başlayan kademeli fiyat — her ek 1.000 adet için sabit ek ücret avantajı.",
  ),
  basePrice: 0,
  startingPrice: 1750,
  sizeLabel: "110 gr 1.Hamur · 10.5×24 cm Diplomat",
  productionTime: "2-3 iş günü",
  images: [prodImg("zarf-diplomat-tek-renk", 1)],
  rating: { average: 4.7, count: 38 },
  features: [
    "110 gr 1.Hamur kâğıt",
    "10.5×24 cm Diplomat (Avrupa DL formatı)",
    "Tek renk baskı (siyah veya istediğiniz pantone)",
    "Pencereli/penceresiz seçeneği (sipariş notu)",
    "1.000 adetten başlayan, +1.000 kademeleri ile genişleyebilen sipariş",
  ],
  useCases: [
    "Resmi yazışma ve mektup gönderimi",
    "Fatura ve dekont gönderimi",
    "Sigorta poliçe gönderimi",
    "Bayilik/dağıtıcı kanal evrakı",
  ],
  specifications: [
    { label: "Kâğıt", value: "110 gr 1.Hamur" },
    { label: "Ebat", value: "10.5 × 24 cm (Diplomat / DL)" },
    { label: "Baskı", value: "Tek renk (siyah veya tek pantone)" },
    { label: "Üretim Süresi", value: "2-3 iş günü" },
  ],
  faqs: [
    { q: "Pencereli zarf nasıl sipariş ederim?", a: "Sipariş notuna 'pencereli' yazmanız yeterli — pencere standart sol orta konumda açılır. Özel pencere konumu için tasarımda işaretleme yapın." },
    { q: "İkinci renk eklenir mi?", a: "Evet — Diplomat Zarf Renkli ürünümüz tam renkli (CMYK) baskı sunar; ek renkli logo için ona yönelin." },
  ],
  relatedSlugs: ["zarf-diplomat-renkli", "zarf-torba", "antetli-kagit"],
  parameters: [
    buildMatrix({
      label: "Adet",
      matrixNote: "110 gr 1.Hamur · 10.5×24 cm Diplomat · Tek Renk Baskı — her +1.000 adet için 1.075 TL",
      rows: [
        { id: "diplomat-tr", label: "Diplomat Tek Renk", sublabel: "10.5×24 cm · 110 gr", code: "Z1", prices: { "1000": 1750, "2000": 2825, "3000": 3900, "5000": 6050, "10000": 11425 } },
      ],
      cols: [
        { id: "1000", label: "1.000 Adet" },
        { id: "2000", label: "2.000 Adet" },
        { id: "3000", label: "3.000 Adet" },
        { id: "5000", label: "5.000 Adet" },
        { id: "10000", label: "10.000 Adet" },
      ],
    }),
  ],
  seo: {
    title: "Diplomat Zarf — 10.5×24 cm Tek Renk Baskı, 1.750 TL'den",
    description: "110 gr 1.Hamur Diplomat zarf 10.5×24 cm tek renk baskı 1.750 TL'den. 1.000-10.000 adet, resmi yazışma, fatura gönderimi için.",
    keywords: ["diplomat zarf", "zarf baskı", "tek renk zarf", "10.5x24 zarf", "kurumsal zarf", "fatura zarfı", "dl zarf"],
  },
};

const zarfDiplomatRenkli: Product = {
  slug: "zarf-diplomat-renkli",
  name: "Diplomat Zarf — 10.5×24 cm Renkli Baskı",
  categorySlug: "zarf",
  sku: "MK-ZRF-DP-RNK",
  brand: "Markala",
  shortDescription: "110 gr 1.Hamur Diplomat Zarf — Tam Renkli (CMYK) Baskı",
  description: note(
    "Logo ve tasarımı tam renkli (CMYK 4+0) basılan 110 gr 1.Hamur 10.5×24 cm Diplomat zarf. Marka kimliğinizi kurumsal yazışmada güçlü gösterir; davetiye, kart, mektup gönderimi için lüks segment. 1.000 adetten başlar, her ek 1.000 adet için 1.250 TL avantajlı.",
  ),
  basePrice: 0,
  startingPrice: 2375,
  sizeLabel: "110 gr 1.Hamur · 10.5×24 cm · Tam Renkli",
  productionTime: "2-3 iş günü",
  images: [prodImg("zarf-diplomat-renkli", 1)],
  badges: ["yeni"],
  rating: { average: 4.8, count: 21 },
  features: [
    "110 gr 1.Hamur kâğıt",
    "10.5×24 cm Diplomat (DL)",
    "Tam Renkli (CMYK 4+0) baskı",
    "Logo + tasarım + arka kapak baskı",
    "Her +1.000 adet için 1.250 TL ek",
  ],
  useCases: [
    "Davetiye ve özel etkinlik gönderimi",
    "Kurumsal hediye kart, sertifika gönderimi",
    "Lüks segment hizmet teklifi",
    "Marka kimliği güçlü kurumsal yazışma",
  ],
  specifications: [
    { label: "Kâğıt", value: "110 gr 1.Hamur" },
    { label: "Ebat", value: "10.5 × 24 cm (Diplomat / DL)" },
    { label: "Baskı", value: "Tam Renkli CMYK (4+0)" },
    { label: "Üretim Süresi", value: "2-3 iş günü" },
  ],
  faqs: [
    { q: "İçeriden de baskı ister misiniz?", a: "İçeride desen baskısı (lining) ek ücretli; sipariş notunda belirtin, özel teklif sunalım. Lüks davetiye ve sertifikalar için tercih edilir." },
  ],
  relatedSlugs: ["zarf-diplomat-tek-renk", "zarf-torba", "antetli-kagit"],
  parameters: [
    buildMatrix({
      label: "Adet",
      matrixNote: "110 gr 1.Hamur · 10.5×24 cm · Tam Renkli — her +1.000 adet için 1.250 TL",
      rows: [
        { id: "diplomat-renkli", label: "Diplomat Renkli", sublabel: "10.5×24 cm · 110 gr · CMYK", code: "Z2", prices: { "1000": 2375, "2000": 3625, "3000": 4875, "5000": 7375, "10000": 13625 } },
      ],
      cols: [
        { id: "1000", label: "1.000 Adet" },
        { id: "2000", label: "2.000 Adet" },
        { id: "3000", label: "3.000 Adet" },
        { id: "5000", label: "5.000 Adet" },
        { id: "10000", label: "10.000 Adet" },
      ],
    }),
  ],
  seo: {
    title: "Diplomat Renkli Zarf — 10.5×24 cm CMYK Baskı, 2.375 TL'den",
    description: "110 gr 1.Hamur 10.5×24 cm Diplomat zarf, tam renkli CMYK baskı. Davetiye, sertifika, lüks kurumsal yazışma için. 1.000-10.000 adet.",
    keywords: ["renkli zarf", "diplomat zarf renkli", "cmyk zarf baskı", "davetiye zarfı", "lüks zarf", "kurumsal zarf"],
  },
};

const zarfTorba: Product = {
  slug: "zarf-torba",
  name: "Torba Zarf — 24×32 cm Renkli",
  categorySlug: "zarf",
  sku: "MK-ZRF-TRB-2432",
  brand: "Markala",
  shortDescription: "110 gr 1.Hamur Torba Zarf 24×32 cm — Tam Renkli Baskı",
  description: note(
    "A4 evrak, sözleşme, broşür ve büyük belgelerin gönderilmesi için 110 gr 1.Hamur kâğıttan 24×32 cm torba zarf, tam renkli (CMYK) baskı ile. 500 adetten başlar, her ek 500 adet için 1.875 TL. Ihale dosyası, banka kredi belge takımı, sigorta poliçe seti gibi kalın evrak gönderimi için ideal.",
  ),
  basePrice: 0,
  startingPrice: 3500,
  sizeLabel: "110 gr 1.Hamur · 24×32 cm Torba · Tam Renkli",
  productionTime: "2-3 iş günü",
  images: [prodImg("zarf-torba", 1)],
  rating: { average: 4.6, count: 17 },
  features: [
    "110 gr 1.Hamur kâğıt",
    "24×32 cm Torba (A4 evrak için ideal)",
    "Tam Renkli (CMYK 4+0) baskı",
    "500 adetten başlayan, +500 kademeli sipariş",
  ],
  useCases: [
    "İhale dosyası ve sözleşme gönderimi",
    "Banka kredi belge takımı",
    "Sigorta poliçe gönderimi",
    "Üniversite-okul belge takımı",
    "Kurumsal teklif dosyası",
  ],
  specifications: [
    { label: "Kâğıt", value: "110 gr 1.Hamur" },
    { label: "Ebat", value: "24 × 32 cm (Torba)" },
    { label: "Baskı", value: "Tam Renkli CMYK (4+0)" },
    { label: "Üretim Süresi", value: "2-3 iş günü" },
  ],
  faqs: [
    { q: "Daha kalın gramaj var mı?", a: "Standart 110 gr. Kalın belge için 130 gr opsiyonu sipariş notuyla istenebilir, %20 ek ücretli." },
  ],
  relatedSlugs: ["zarf-diplomat-renkli", "antetli-kagit"],
  parameters: [
    buildMatrix({
      label: "Adet",
      matrixNote: "110 gr 1.Hamur · 24×32 cm Torba · Tam Renkli — her +500 adet için 1.875 TL",
      rows: [
        { id: "torba-renkli", label: "Torba Zarf Renkli", sublabel: "24×32 cm · 110 gr · CMYK", code: "Z3", prices: { "500": 3500, "1000": 5375, "1500": 7250, "2500": 11000, "5000": 20375 } },
      ],
      cols: [
        { id: "500", label: "500 Adet" },
        { id: "1000", label: "1.000 Adet" },
        { id: "1500", label: "1.500 Adet" },
        { id: "2500", label: "2.500 Adet" },
        { id: "5000", label: "5.000 Adet" },
      ],
    }),
  ],
  seo: {
    title: "Torba Zarf — 24×32 cm Renkli, A4 Evrak İçin 3.500 TL'den",
    description: "110 gr 1.Hamur 24×32 cm torba zarf, tam renkli baskı. İhale, sözleşme, banka belgesi gönderimi için. 500-5.000 adet kademeli fiyat.",
    keywords: ["torba zarf", "24x32 zarf", "a4 zarf", "renkli torba zarf", "ihale zarfı", "büyük zarf baskı"],
  },
};

// ============================================================================
// 11. MAGNET — 60 mikron 46×68 mm Promosyon Magneti (kartvizit boy)
// ============================================================================
const magnetPromosyon: Product = {
  slug: "magnet-promosyon",
  name: "Promosyon Magnet — 60 Mikron 46×68 mm",
  categorySlug: "magnet",
  sku: "MK-MGN-60",
  brand: "Markala",
  shortDescription: "60 mikron 46×68 mm renkli magnet — buzdolabı tipi promosyon, 1.000-10.000+ adet",
  description: note(
    "Buzdolabı, metal yüzey ve mıknatıs tutan her zemine yapışan 60 mikron renkli baskılı promosyon magneti. 46×68 mm (kartvizit boyutu) — özel kesimli veya kenarları oval kesimli iki seçenek. Eczane, taksi, restoran, mağaza ve kargo şirketlerinin müşteriye verdiği en sık tercih edilen 'kalıcı reklam' ürünüdür. 1.000 adetten başlar, 10.000+ adette birim fiyat avantajı belirgin düşer.",
  ),
  basePrice: 0,
  startingPrice: 630,
  sizeLabel: "60 mikron · 46×68 mm · Renkli Parlak Selefon",
  productionTime: "3-4 iş günü",
  images: [prodImg("magnet-promosyon", 1)],
  badges: ["cok-satilan", "yeni"],
  bestseller: true,
  rating: { average: 4.8, count: 67 },
  features: [
    "60 mikron magnet — buzdolabı tipi yapışkan",
    "46×68 mm — kartvizit boyutu",
    "Özel Kesim veya Oval Kesim seçenekleri",
    "Parlak selefon korumalı renkli baskı",
    "1.000 adetten 10.000+ adete kademeli toptan fiyat",
    "Bonus: 1 cm kare özel kesim opsiyonu — sipariş notunda belirtin",
  ],
  useCases: [
    "Eczane, klinik, sağlık merkezi tanıtım",
    "Taksi, kurye, ulaşım firmaları",
    "Restoran, kafe, fast-food paket servis kartı",
    "Mağaza ve hizmet sektörü promosyon",
    "Düğün, organizasyon hatırası",
  ],
  specifications: [
    { label: "Malzeme", value: "60 mikron magnet + parlak selefon" },
    { label: "Ebat", value: "46 × 68 mm (kartvizit boyutu)" },
    { label: "Kesim", value: "Özel Kesim veya Oval Kesim" },
    { label: "Baskı", value: "Renkli (4+0)" },
    { label: "Üretim Süresi", value: "3-4 iş günü" },
  ],
  faqs: [
    { q: "Araç magneti istiyorum, bu ürün uygun mu?", a: "Hayır. Bu ürün 60 mikron promosyon magnetidir — ince ve hafif. Araç magneti için 0.8 mm kalın magnet gerekir; 'Araç Magneti' kategorimize bakınız." },
    { q: "1 cm kare özel kesim ne için?", a: "Logo veya küçük marka sembolü için 1 cm² hücre formunda özel kesim hizmeti. Sipariş notunda 'cm kare' yazın, fiyat 1.000 adet için 24 TL/cm² tarifesinden hesaplanır." },
  ],
  relatedSlugs: ["klasik-kartvizit", "etiket", "trodat-printy-4912"],
  parameters: [
    buildMatrix({
      label: "Kesim × Adet",
      matrixNote: "60 mikron · 46×68 mm · Renkli Parlak Selefon — birim fiyat 10.000+ adette düşer",
      rows: [
        { id: "ozel", label: "Özel Kesim", sublabel: "46×68 mm — Parlak Selefon Özel Kesim", code: "MAG1", prices: { "1000": 700, "10000": 6700 } },
        { id: "oval", label: "Oval Kesim", sublabel: "46×68 mm — Parlak Selefon Oval Kesim", code: "MAG2", prices: { "1000": 630, "10000": 6200 } },
      ],
      cols: [
        { id: "1000", label: "1.000 Adet" },
        { id: "10000", label: "10.000 Adet", sublabel: "Toptan" },
      ],
      defaultRowId: "oval",
      defaultColId: "1000",
    }),
  ],
  seo: {
    title: "Promosyon Magnet — 60 Mikron 46×68 mm Renkli, 630 TL'den",
    description: "60 mikron 46×68 mm buzdolabı tipi renkli promosyon magnet baskı. Özel/oval kesim, parlak selefon, 1.000-10.000+ adet. Eczane, taksi, restoran için.",
    keywords: ["magnet baskı", "promosyon magnet", "buzdolabı magneti", "46x68 magnet", "kartvizit magnet", "eczane magneti", "taksi magneti"],
  },
};

// ============================================================================
// 12. AMERİKAN SERVİS — 3 ebat × 3 adet bandı
// ============================================================================
const amerikanServis: Product = {
  slug: "amerikan-servis",
  name: "Amerikan Servis — Tek Yön Renkli Baskı",
  categorySlug: "amerikan-servis",
  sku: "MK-SRV",
  brand: "Markala",
  shortDescription: "Restoran-kafe için tek kullanımlık tray underliner — 90/100/120 gr",
  description: note(
    "Restoran ve kafelerin tepsi altına serdiği tek kullanımlık servis altlığı (placemat). 31×44 cm 90 gr 1.Hamur (ekonomik), 27.5×40 cm 100 gr Kuşe (orta segment) ve 34×49 cm 120 gr 1.Hamur (premium) seçenekleri; tek yön renkli (4+0) baskı ile menü, kampanya, marka tanıtımı içerir. 2.000 adetten başlayan kademeli fiyat — her ek 2.000 adet için sabit ek tutar.",
  ),
  basePrice: 0,
  startingPrice: 2750,
  sizeLabel: "Tek Yön Renkli · 3 Ebat / Gramaj",
  productionTime: "2-3 iş günü",
  images: [prodImg("amerikan-servis", 1)],
  rating: { average: 4.7, count: 29 },
  features: [
    "3 ebat × gramaj kombinasyonu",
    "31×44 cm 90 gr 1.Hamur (ekonomik)",
    "27.5×40 cm 100 gr Kuşe (orta segment)",
    "34×49 cm 120 gr 1.Hamur (premium kalın)",
    "Tek yön renkli (4+0) baskı",
    "2.000 adetten başlayan, +2.000 kademeli sipariş",
  ],
  useCases: [
    "Restoran ve kafe tepsi altlığı",
    "Hızlı yiyecek servisi",
    "Otel kahvaltı tepsisi",
    "Tanıtım kampanyası ve menü değişikliği",
    "Etkinlik kokteyl tray underliner",
  ],
  specifications: [
    { label: "Baskı", value: "Tek Yön Renkli (4+0)" },
    { label: "Ebat / Gramaj", value: "31×44 cm 90 gr / 27.5×40 cm 100 gr Kuşe / 34×49 cm 120 gr" },
    { label: "Üretim Süresi", value: "2-3 iş günü" },
  ],
  faqs: [
    { q: "Hangi gramaj benim restoranım için uygun?", a: "Hızlı tüketim (fast food) için 90 gr ekonomik yeterli. Tüketim hızı orta olan klasik kafelerde 100 gr Kuşe daha şık görünür ve sıvıya kısmen dayanır. Otel-fine dining için 120 gr 1.Hamur premium bir hissiyat verir." },
    { q: "Çift yön baskı yapıyor musunuz?", a: "Standart tek yön. Çift yön ihtiyacı için sipariş notunda belirtin; %40 ek ücretle uygulanır." },
  ],
  relatedSlugs: ["brosur", "selefonlu-brosur", "el-ilani"],
  parameters: [
    buildMatrix({
      label: "Ebat / Gramaj × Adet",
      matrixNote: "Tek Yön Renkli (4+0) — her +2.000 adet için satıra göre ek ücret",
      rows: [
        { id: "31x44-90gr", label: "31×44 cm — 90 gr Hamur", sublabel: "Ekonomik · her +2.000: 3.000 TL", code: "SRV1", prices: { "2000": 3250, "4000": 6250, "6000": 9250 } },
        { id: "27.5x40-100gr", label: "27.5×40 cm — 100 gr Kuşe", sublabel: "Orta segment · her +2.000: 2.450 TL", code: "SRV2", prices: { "2000": 2750, "4000": 5200, "6000": 7650 } },
        { id: "34x49-120gr", label: "34×49 cm — 120 gr Hamur", sublabel: "Premium · her +2.000: 3.125 TL", code: "SRV3", prices: { "2000": 4250, "4000": 7375, "6000": 10500 } },
      ],
      cols: [
        { id: "2000", label: "2.000 Adet" },
        { id: "4000", label: "4.000 Adet" },
        { id: "6000", label: "6.000 Adet" },
      ],
      defaultRowId: "27.5x40-100gr",
      defaultColId: "2000",
    }),
  ],
  seo: {
    title: "Amerikan Servis Baskı — Tek Yön Renkli 3 Ebat, 2.750 TL'den",
    description: "Restoran-kafe için tek kullanımlık amerikan servis baskı: 31×44 / 27.5×40 / 34×49 cm — 90-100-120 gr seçenekler. 2.000-6.000 adet kademeli.",
    keywords: ["amerikan servis", "tray underliner", "restoran servis altı", "kafe servis", "tepsi altı kağıt", "amerikan servis baskı"],
  },
};

// ============================================================================
// 13. KAPI ASKI BROŞÜRLERİ — 3 varyant × 1.000 adet sabit
// ============================================================================
const kapiAskiBrosur: Product = {
  slug: "kapi-aski-brosur",
  name: "Kapı Askı Broşür — Çift Yön Renkli Mat Selefon Kabartma Lak",
  categorySlug: "kapi-aski-brosur",
  sku: "MK-ASK",
  brand: "Markala",
  shortDescription: "Otel, mağaza, dağıtım için kapı kolu askı broşür — premium kombinler",
  description: note(
    "Otel oda kapı kolu, mağaza vitrin kapı kolu, apartman kapısına asılı dağıtım için 'kapı askı' broşürlerimiz; çift yön renkli baskı + mat selefon + kabartma lak ile premium hissiyat. 350 gr Kuşe, 700 gr Bristol veya 200 gr Kuşe parlak selefon seçenekleri. 1.000 adet sabit paket fiyatı.",
  ),
  basePrice: 0,
  startingPrice: 2625,
  sizeLabel: "Çift Yön · Mat/Parlak Selefon · 3 Varyant",
  productionTime: "3-4 iş günü",
  images: [prodImg("kapi-aski-brosur", 1)],
  badges: ["yeni"],
  rating: { average: 4.7, count: 18 },
  features: [
    "Otel/mağaza/dağıtım için kapı kolu askı broşür",
    "Çift yön renkli baskı",
    "350 gr Kuşe (ASK1), 700 gr Bristol (ASK2), 200 gr Kuşe parlak (ASK3) seçenek",
    "Mat selefon + kabartma lak (ASK1, ASK2) veya parlak selefon (ASK3)",
    "Kapı kolu deliği şablonlu kesim dahil",
    "1.000 adet sabit paket",
  ],
  useCases: [
    "Otel oda kapı bilgilendirme (DND, hizmet)",
    "Mağaza vitrin günlük kampanya",
    "Apartman dağıtım reklam",
    "Restoran-kafe takeaway promosyon",
    "Açılış ve etkinlik dağıtımı",
  ],
  specifications: [
    { label: "Baskı", value: "Çift Yön Renkli (4+4)" },
    { label: "Varyantlar", value: "ASK1: 350 gr Kuşe Mat Selefon Kabartma Lak (10.5×24) · ASK2: 700 gr Bristol Mat Selefon Kabartma Lak (10.5×24) · ASK3: 200 gr Kuşe Parlak Selefon (21×26)" },
    { label: "Kesim", value: "Kapı kolu deliği dahil" },
    { label: "Adet", value: "1.000 (sabit)" },
    { label: "Üretim Süresi", value: "3-4 iş günü" },
  ],
  faqs: [
    { q: "Otel için hangisini seçmeliyim?", a: "ASK2 (700 gr Bristol) en kalın ve premium hissiyat verir; uzun süre kapı kolunda asılı kalacak DND ('Do Not Disturb' / 'Rahatsız Etmeyin') veya hizmet bilgilendirme için ideal." },
    { q: "21×26 ebat A5'e çok yakın, neden farklı?", a: "ASK3 21×26 cm 'kapı askılı' format, üst kısımda kapı kolu deliği bulunur, A5'ten farklı olarak kapıya asma için tasarlanmıştır." },
  ],
  relatedSlugs: ["selefonlu-brosur", "brosur", "el-ilani"],
  parameters: [
    buildMatrix({
      label: "Varyant",
      matrixNote: "Çift Yön Renkli — 1.000 adet sabit paket",
      rows: [
        { id: "ask1", label: "ASK1 — 350 gr Kuşe Mat Selefon Kabartma Lak", sublabel: "10.5 × 24 cm", code: "ASK1", prices: { "1000": 2625 } },
        { id: "ask2", label: "ASK2 — 700 gr Bristol Mat Selefon Kabartma Lak", sublabel: "10.5 × 24 cm", code: "ASK2", prices: { "1000": 2875 } },
        { id: "ask3", label: "ASK3 — 200 gr Kuşe Parlak Selefon", sublabel: "21 × 26 cm", code: "ASK3", prices: { "1000": 4700 } },
      ],
      cols: [{ id: "1000", label: "1.000 Adet" }],
      defaultRowId: "ask1",
      defaultColId: "1000",
    }),
  ],
  seo: {
    title: "Kapı Askı Broşür — Otel/Mağaza Premium Kapı Kolu Broşürü",
    description: "Çift yön renkli, mat/parlak selefonlu, kabartma laklı kapı askı broşür. 350 gr Kuşe / 700 gr Bristol / 200 gr Kuşe seçenekleri, 1.000 adet 2.625 TL'den.",
    keywords: ["kapı askı broşür", "kapı kolu broşür", "otel dnd kart", "rahatsız etmeyin kart", "kapı askılı tanıtım"],
  },
};

// ============================================================================
// 14. CEPLİ DOSYA — 22.5×31 cm Renkli, 7 varyant × 2 adet
// ============================================================================
const cepliDosya: Product = {
  slug: "cepli-dosya",
  name: "Cepli Dosya — Kapalı Hâli 22.5×31 cm",
  categorySlug: "cepli-dosya",
  sku: "MK-CD",
  brand: "Markala",
  shortDescription: "Avukat ve kurumsal teklif için cepli dosya — 7 varyant × 500/1.000 adet",
  description: note(
    "Avukat dosyası, kurumsal teklif sunumu, ihale dosya kapağı ve marka tanıtım dosyası için kullanılan kapalı hâli 22.5×31 cm cepli dosya. 7 farklı kâğıt-kaplama varyantı (mat/parlak selefon, kabartma lak, çift yön baskı, 400 gr lak, 300 gr Bristol selefonsuz). Kulakçık yapıştırma fiyata dahildir.\n\n**Önemli not:** Avukat dosyalarında dosya teli dahil değildir. Avukat dosyalarında selefon talebi için: 500 adet 850 TL, 1.000 adet 1.000 TL ek ücretle uygulanır.",
  ),
  basePrice: 0,
  startingPrice: 5000,
  sizeLabel: "22.5×31 cm Kapalı · Renkli · Kulakçık Dahil",
  productionTime: "4-5 iş günü",
  images: [prodImg("cepli-dosya", 1)],
  badges: ["yeni"],
  rating: { average: 4.6, count: 22 },
  features: [
    "Kapalı hâli 22.5×31 cm — A4 evrak için cep",
    "Kulakçık yapıştırma fiyata dahil",
    "7 varyant: 350-400 gr Kuşe / 300 gr Bristol",
    "Mat selefon, parlak selefon, kabartma lak seçenekleri",
    "500 ve 1.000 adet kademeleri",
    "Avukat dosyalarında dosya teli ayrı (sipariş notu)",
  ],
  useCases: [
    "Avukat dosya kapağı",
    "Kurumsal teklif sunumu",
    "İhale dosyası ve sözleşme kapağı",
    "Marka tanıtım dosyası",
    "Üniversite-okul kayıt dosyası",
  ],
  specifications: [
    { label: "Kapalı Ebat", value: "22.5 × 31 cm" },
    { label: "Açık Ebat", value: "45 × 31 cm (kulakçıklı)" },
    { label: "Baskı", value: "Tek/Çift yön renkli (varyant bazlı)" },
    { label: "Kulakçık", value: "Yapıştırma dahil" },
    { label: "Üretim Süresi", value: "4-5 iş günü" },
  ],
  faqs: [
    { q: "Avukat dosyası selefon ek ücreti ne?", a: "Avukat dosyalarında selefon istenirse: 500 adet 850 TL, 1.000 adet 1.000 TL ek ücret. Sipariş notunda belirtin." },
    { q: "Dosya teli ürünle birlikte mi?", a: "Avukat dosyalarında dosya teli dahil DEĞİLDİR. Diğer kurumsal cepli dosyalarda ihtiyaç durumunda sipariş notuyla istenebilir; ayrı fiyatlandırılır." },
    { q: "Kulakçık nedir?", a: "Cepli dosyanın iç kısmındaki, evrakı tutan üçgen bukle. Yapıştırılmış olarak teslim edilir, fiyat dahildir." },
  ],
  relatedSlugs: ["zarf-torba", "antetli-kagit", "kapakli-bloknot"],
  parameters: [
    buildMatrix({
      label: "Varyant × Adet",
      matrixNote: "22.5×31 cm Kapalı · Renkli · Kulakçık dahil — Avukat dosyaları için selefon ek (500: +850 TL / 1.000: +1.000 TL)",
      rows: [
        { id: "mnd", label: "MND — Mat Selefon İçi Tek Renk", sublabel: "350 gr Kuşe Tek Yön Çok Renkli Mat Selefon", code: "MND", prices: { "500": 5800, "1000": 8500 } },
        { id: "kld", label: "KLD — Mat Selefon Kabartma Lak", sublabel: "350 gr Kuşe Tek Yön Çok Renkli Mat Selefon Kabartma Lak", code: "KLD", prices: { "500": 6500, "1000": 8900 } },
        { id: "pd", label: "PD — Parlak Selefon", sublabel: "350 gr Kuşe Tek Yön Çok Renkli Parlak Selefon", code: "PD", prices: { "1000": 8400 } },
        { id: "cypd", label: "CYPD — Çift Yön Parlak", sublabel: "350 gr Kuşe Çift Yön Baskı Parlak Selefon", code: "CYPD", prices: { "1000": 11300 } },
        { id: "cymd", label: "CYMD — Çift Yön Mat", sublabel: "350 gr Kuşe Çift Yön Baskı Mat Selefon", code: "CYMD", prices: { "1000": 11500 } },
        { id: "cyml4d", label: "CYML4D — 400 gr Mat Lak", sublabel: "400 gr Kuşe Çift Yön Renkli Mat Selefon Lak", code: "CYML4D", prices: { "1000": 15000 } },
        { id: "avd", label: "AVD — Avukat Dosyası Selefonsuz", sublabel: "300 gr Bristol Tek Yön Arkası Tek Renk Siyah Selefonsuz · Tel/selefon ek", code: "AVD", prices: { "500": 5000, "1000": 6150 } },
      ],
      cols: [
        { id: "500", label: "500 Adet" },
        { id: "1000", label: "1.000 Adet" },
      ],
      defaultRowId: "mnd",
      defaultColId: "1000",
    }),
  ],
  seo: {
    title: "Cepli Dosya — 22.5×31 cm Kapalı, Avukat & Kurumsal, 5.000 TL'den",
    description: "Avukat dosyası ve kurumsal teklif için 22.5×31 cm cepli dosya. 7 varyant: mat/parlak selefon, kabartma lak. Kulakçık dahil, 500-1.000 adet.",
    keywords: ["cepli dosya", "avukat dosyası", "kurumsal dosya", "teklif dosyası", "ihale dosyası", "selefonlu dosya"],
  },
};

export const matbaaProducts2: Product[] = [
  antetliKagit,
  zarfDiplomatTekRenk,
  zarfDiplomatRenkli,
  zarfTorba,
  magnetPromosyon,
  amerikanServis,
  kapiAskiBrosur,
  cepliDosya,
];
