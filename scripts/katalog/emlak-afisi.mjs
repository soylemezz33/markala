#!/usr/bin/env node
/**
 * "Emlak Afişi" kategorisi + ürünü (2026-09-04, Hasan talebi).
 *
 * Kaynak: kampanya görseli — 5 ebat, adet başına KDV DAHİL satış fiyatı, minimum 5 adet:
 *   50×70 → 70 ₺ · 70×100 → 125 ₺ · 70×150 → 160 ₺ · 100×150 → 210 ₺ (çok satan, Hasan 2026-09-04 akşam) · 100×200 → 290 ₺
 *
 * MODEL (additive): grup `ebat` (priced) × grup `adet` (dimension). "adet" TEK dimension olduğu
 * için fiyat-boyutu olur (kartvizit/afiş gibi MATRİS): her (ebat, adet-kademesi) satırının price'ı
 * = birim × adet. Böylece İSG'deki lineer yol (unit × qty × hacim indirimi) DEVREYE GİRMEZ;
 * fiyatlar görseldekiyle birebir kalır ve en düşük kademe (5) minimum siparişi zorlar.
 * Kademeler arası birim fiyat eşit olduğundan adetTierBadges rozet üretmez (max/min < 1.15).
 *
 * Kullanım:
 *   ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/katalog/emlak-afisi.mjs --dry            # yazmaz, payload+fiyat tablosu
 *   ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/katalog/emlak-afisi.mjs --image <webp>   # ilk kurulum (görsel yükler)
 *   ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/katalog/emlak-afisi.mjs                  # idempotent güncelleme
 * Ortam: API_URL (varsayılan https://api.markala.com.tr). Kimlik: Projects\markala-google\.env içindeki ADMIN_*.
 */
import { readFile } from "node:fs/promises";
import { basename } from "node:path";

const API = process.env.API_URL || "https://api.markala.com.tr";
const args = process.argv.slice(2);
const DRY = args.includes("--dry");
const imgIdx = args.indexOf("--image");
const IMAGE_PATH = imgIdx >= 0 ? args[imgIdx + 1] : null;

const CAT_SLUG = "emlak-afisi";
const SLUG = "emlak-afisi";
const ACCENT = "#4A2A9E";

// ---- Fiyat kaynağı (KDV dahil, adet başına) ----
const EBATLAR = [
  { key: "50x70", label: "50 × 70 cm", tl: 70 },
  { key: "70x100", label: "70 × 100 cm", tl: 125 },
  { key: "70x150", label: "70 × 150 cm", tl: 160 },
  { key: "100x150", label: "100 × 150 cm", tl: 210, sublabel: "Çok satan" },
  { key: "100x200", label: "100 × 200 cm", tl: 290 },
];
const MIN_ADET = 5;
const KADEMELER = [5, 10, 15, 20, 25, 30, 40, 50, 75, 100];

const options = [
  ...EBATLAR.map((e, i) => ({
    groupKey: "ebat", groupLabel: "Ebat", groupRole: "priced", groupSort: 0,
    optionKey: e.key, optionLabel: e.label, optionSort: i,
    ...(e.sublabel ? { optionSublabel: e.sublabel } : {}),
    locked: false,
  })),
  ...KADEMELER.map((n, i) => ({
    groupKey: "adet", groupLabel: "Adet", groupRole: "dimension", groupSort: 1,
    optionKey: String(n), optionLabel: `${n} Adet`, optionSort: i,
    ...(n === MIN_ADET ? { optionSublabel: "Minimum sipariş" } : {}),
    locked: false,
  })),
];
const prices = EBATLAR.flatMap((e) => KADEMELER.map((n) => ({ groupKey: "ebat", optionKey: e.key, dimKey: String(n), price: e.tl * n })));
const minToplam = EBATLAR[0].tl * MIN_ADET; // 350 ₺ — kartta "…₺'den" (kartvizit/afiş ile aynı tanım: en düşük satır)

// ---- Metinler ----
const ebatListe = EBATLAR.map((e) => e.label.replace(/ /g, "")).join(", ");
const uyari = "Lütfen Dikkat: Siparişlerinizin Renk, Adet ve Ölçülerinde %1 ila %5 arasında fire olabilmektedir.";

const category = {
  slug: CAT_SLUG,
  name: "Emlak Afişi",
  shortDescription: "Satılık / kiralık emlak afişi — 50×70'ten 100×200 cm'ye 5 ebat, adet başına KDV dahil sabit fiyat",
  longDescription: `Emlak ve gayrimenkul satış danışmanlarına özel satılık / kiralık ilan afişi. ${ebatListe} olmak üzere beş hazır ebat; fiyatlar adet başına ve KDV dahildir, minimum sipariş ${MIN_ADET} adettir. Vitrin camı, ilan panosu, daire kapısı ve inşaat cephesi için portföy tanıtımında kullanılır; tasarımınız yoksa ücretsiz tasarım desteği verilir.`,
  accentColor: ACCENT,
  startingPrice: EBATLAR[0].tl,
  productionTime: "1-2 iş günü",
  sortOrder: 21, // Afiş (21) ile yan yana
  isActive: true,
};
const categoryContent = {
  seo: {
    title: "Emlak Afişi Fiyatları 2026 — Satılık / Kiralık Afiş Baskı, Online Sipariş",
    description: `Emlak afişi baskı: 50×70, 70×100, 70×150, 100×150 ve 100×200 cm ebatlarda satılık / kiralık ilan afişi. Adet başına KDV dahil fiyat, ${MIN_ADET} adetten başlayan sipariş, 1-2 iş günü üretim.`,
  },
  faqs: [
    { q: "Emlak afişi hangi ebatlarda basılıyor?", a: `Beş hazır ebat vardır: ${ebatListe}. 50×70 ve 70×100 cm vitrin camı ve ilan panosu için, 70×150 cm ve üzeri daire balkonu, bina cephesi ve inşaat sahası gibi uzaktan görülmesi gereken noktalar için tercih edilir. En çok satan ebat 100×150 cm'dir.` },
    { q: "Fiyatlar KDV dahil mi, adet başına mı?", a: "Evet. Ürün sayfasındaki fiyatlar adet başına ve KDV dahildir; ebat ve adedi seçtiğinizde toplam tutar anında görünür, sonradan ek ücret çıkmaz." },
    { q: "En az kaç adet emlak afişi sipariş edebilirim?", a: `Minimum sipariş ${MIN_ADET} adettir. Aynı ebattan farklı ilanlar (farklı daire, farklı tasarım) için her tasarımı ayrı satır olarak sepete ekleyebilirsiniz; adet kademeleri ${KADEMELER[0]} ile ${KADEMELER[KADEMELER.length - 1]} arasında seçilir.` },
    { q: "Afişi dış mekânda, balkon veya cephede kullanabilir miyim?", a: "Kâğıt afiş vitrin arkası ve korunaklı iç mekân için üretilir; doğrudan yağmur ve güneş alan cephe, balkon ve inşaat sahası için aynı tasarımı vinil branda üzerine bastırmanızı öneririz. Vinil Branda Afiş kategorisinden ölçünüzü girerek fiyatı görebilirsiniz." },
    { q: "Tasarımım yok, afişi kim hazırlayacak?", a: "Sipariş sırasında ücretsiz tasarım desteği isteyebilirsiniz. İlan bilgilerini (satılık/kiralık, oda sayısı, m², kat, telefon, ofis logosu) sipariş notuna yazmanız yeterlidir; tasarım onayınızdan sonra baskıya geçilir." },
    { q: "Kaç günde teslim edilir?", a: "Dosya onayından sonra üretim 1-2 iş günü sürer; afişler kırışmaması için rulo halinde DHL ile gönderilir ve 81 ile 2-4 iş gününde ulaşır." },
  ],
  seoBolumler: [
    {
      baslik: "Emlak Afişi Fiyat Listesi (KDV Dahil, Adet Başına)",
      paragraflar: [
        `Emlak afişi fiyatını yalnızca ebat belirler; kâğıt ve baskı tekniği sabittir. Aşağıdaki tablo adet başına KDV dahil satış fiyatlarıdır, minimum sipariş ${MIN_ADET} adettir.`,
      ],
      tablo: {
        basliklar: ["Ebat", "Adet fiyatı (KDV dahil)", `${MIN_ADET} adet toplam`],
        satirlar: EBATLAR.map((e) => [e.label + (e.sublabel ? ` (${e.sublabel.toLowerCase()})` : ""), `${e.tl} TL`, `${e.tl * MIN_ADET} TL`]),
      },
    },
    {
      baslik: "Hangi Ebat Nerede Kullanılır?",
      paragraflar: [
        "50×70 cm: ofis vitrini, ilan panosu ve daire kapısı gibi yakından okunan yüzeyler. 70×100 cm: vitrin ve bina girişi için dengeli ebat. 70×150 ve 100×150 cm: balkon korkuluğu, bahçe duvarı ve apartman cephesi; 100×150 cm en çok tercih edilen ölçüdür. 100×200 cm: inşaat sahası, boş arsa ve ana cadde üzerindeki dükkânlar gibi uzaktan görülmesi gereken noktalar.",
        "Kaba kural: her 1 metre okuma mesafesi için en az 1 cm harf yüksekliği. Sokağın karşısından okunacak 'SATILIK' başlığı 100×150 cm afişte 15-20 cm yüksekliğinde tasarlanmalıdır; telefon numarası ise başlığın yarısı kadar büyük olmalıdır.",
      ],
    },
    {
      baslik: "Tasarım İpuçları ve Dosya Hazırlığı",
      paragraflar: [
        "Etkili bir emlak afişinde üç öge öne çıkar: SATILIK / KİRALIK başlığı, telefon numarası ve ofis logosu. Oda sayısı, metrekare, kat ve ısınma tipi gibi bilgileri tek satırda toplayın; fotoğraf kullanacaksanız afişin üst yarısına yerleştirin ve altını sade bırakın.",
        "Dosyayı seçtiğiniz ebatta, her kenardan 3 mm taşma payıyla, CMYK renk uzayında ve 300 dpi çözünürlükte PDF olarak gönderin. Hazır tasarımınız yoksa sipariş sırasında ücretsiz tasarım desteği isteyebilirsiniz; ilan bilgilerinizi sipariş notuna yazmanız yeterlidir.",
      ],
    },
  ],
};

const description = `Emlak ve gayrimenkul satış danışmanları için satılık / kiralık ilan afişi. ${ebatListe} olmak üzere beş hazır ebatta, kuşe kâğıt üzerine tek yön renkli dijital baskı. Fiyatlar adet başına ve KDV dahildir; ebat ve adedi seçtiğinizde toplam tutar anında görünür. Minimum sipariş ${MIN_ADET} adettir. Vitrin camı, ilan panosu, daire kapısı ve bina cephesi için portföy tanıtımı; tasarımınız yoksa ücretsiz tasarım desteği verilir. Dış mekânda uzun süre kalacak afişler için Vinil Branda Afiş kategorimize bakınız.\n\n${uyari}`;

const product = {
  name: "Emlak Afişi — Satılık / Kiralık İlan Afişi",
  slug: SLUG,
  shortDescription: `Emlak ofisleri için satılık / kiralık afişi — 5 ebat, adet başına KDV dahil sabit fiyat, min. ${MIN_ADET} adet`,
  description,
  basePrice: minToplam,
  startingPrice: minToplam,
  productionTime: "1-2 iş günü",
  sizeLabel: `5 Ebat · 50×70 – 100×200 cm · Min. ${MIN_ADET} Adet`,
  badges: ["yeni"],
  isActive: true,
};
const productContent = {
  seo: {
    title: `Emlak Afişi Baskı — Satılık / Kiralık Afiş, 5 Ebat, Adet ${EBATLAR[0].tl} TL'den (KDV Dahil)`,
    keywords: ["emlak afişi", "satılık afişi", "kiralık afişi", "emlak afiş baskı", "gayrimenkul afişi", "emlak ofisi afişi", "satılık kiralık afiş", "afiş baskı"],
    description: `Emlak afişi baskı: ${ebatListe} ebatlarda satılık / kiralık ilan afişi. Adet başına KDV dahil sabit fiyat, minimum ${MIN_ADET} adet, 1-2 iş günü üretim, ücretsiz tasarım desteği.`,
  },
  sku: "MK-EMLAK-AFS",
  brand: "Markala",
  features: [
    `5 hazır ebat: ${ebatListe}`,
    "Adet başına KDV dahil sabit fiyat — ek ücret yok",
    `Minimum ${MIN_ADET} adet, ${KADEMELER[KADEMELER.length - 1]} adede kadar kademeli sipariş`,
    "Tek yön renkli dijital baskı, canlı mor/sarı gibi kampanya renkleri için uygun",
    "Ücretsiz tasarım desteği (ilan bilgilerini yazmanız yeterli)",
    "1-2 iş günü üretim, rulo halinde kırışmadan teslim",
  ],
  useCases: [
    "Emlak ofisi vitrin ilanı (satılık / kiralık)",
    "Daire kapısı ve apartman girişi ilan afişi",
    "Balkon ve bina cephesi portföy tanıtımı",
    "İnşaat sahası ve arsa satış duyurusu",
    "Ofis içi ilan panosu",
  ],
  specifications: [
    { label: "Ebatlar", value: ebatListe },
    { label: "Baskı", value: "Tek yön renkli dijital baskı, kuşe kâğıt" },
    { label: "Fiyatlandırma", value: `Adet başına, KDV dahil · minimum ${MIN_ADET} adet` },
    { label: "Üretim Süresi", value: "1-2 iş günü" },
  ],
  faqs: [
    { q: "Fiyata KDV dahil mi?", a: "Evet, tabloda ve konfigüratörde gördüğünüz fiyatlar adet başına KDV dahil satış fiyatıdır; ödeme sayfasında ek vergi eklenmez." },
    { q: "Neden en az 5 adet?", a: `Afiş baskısında makine hazırlığı sabit bir maliyettir; ${MIN_ADET} adetlik minimum bu maliyeti dengeler ve adet başına fiyatı düşük tutar. Farklı ilanlar için her tasarımı ayrı satır olarak sepete ekleyebilirsiniz.` },
    { q: "Farklı ebatları aynı siparişte alabilir miyim?", a: "Evet. Her ebadı ayrı satır olarak sepete ekleyin; hepsi tek siparişte üretilip birlikte gönderilir." },
    { q: "Dış mekân için uygun mu?", a: "Kâğıt afiş korunaklı vitrin ve iç mekân içindir. Yağmur ve güneşe doğrudan maruz kalan balkon, cephe ve inşaat sahası için aynı tasarımı Vinil Branda Afiş olarak bastırmanızı öneririz." },
  ],
  relatedSlugs: ["afis-105gr", "avrupa-vinil-branda", "dekota-baski-5mm"],
  birlikteSlugs: ["klasik-kartvizit", "brosur", "el-ilani"],
};

// ---- Doğrulama (yazmadan önce, bellekteki model ile) ----
const { computeConfiguredPrice, volumeDiscountRate } = await import("file:///C:/Users/Administrator/Desktop/markala/apps/api/src/orders/pricing.ts");
const opts = options.map((o) => ({ ...o, rules: null }));
const rows = prices.map((r) => ({ ...r, cost: null }));
let hata = 0;
console.log(`\nFİYAT TABLOSU (KDV dahil) — motor: computeConfiguredPrice, kademe: ${KADEMELER.join("/")}`);
console.log("ebat".padEnd(14) + "birim".padStart(7) + KADEMELER.map((n) => `×${n}`.padStart(9)).join(""));
for (const e of EBATLAR) {
  const satir = [];
  for (const n of KADEMELER) {
    const hesap = computeConfiguredPrice(opts, rows, { ebat: e.key, adet: String(n) });
    const beklenen = e.tl * n;
    if (Math.abs(hesap - beklenen) > 0.001) { hata++; satir.push(`✗${hesap}`); } else satir.push(String(hesap).padStart(9));
  }
  console.log(e.label.padEnd(14) + `${e.tl} ₺`.padStart(7) + satir.join(""));
}
// İSG'deki hacim indirimi bu modelde devrede olmamalı: 100 adet 50×70 = 7.000 ₺ (indirimli olsaydı 4.550 ₺)
const yuz = computeConfiguredPrice(opts, rows, { ebat: "50x70", adet: "100" });
if (yuz !== 70 * 100) { hata++; console.log(`✗ hacim indirimi sızmış: 100×50x70 = ${yuz}`); }
else console.log(`✓ hacim indirimi devre dışı (100 adet 50×70 = ${yuz} ₺; lineer yolda ${Math.round(7000 * (1 - volumeDiscountRate(100)))} ₺ olurdu)`);
console.log(hata ? `\n✗ ${hata} fiyat hatası — yazılmadı` : `✓ 50/50 satır beklenenle aynı · kartta "${minToplam} ₺'den" (5 × 70)`);
if (hata) process.exit(1);

console.log(`\nkategori: ${category.name} (/kategori/${CAT_SLUG}) · sortOrder ${category.sortOrder} · ${categoryContent.faqs.length} SSS · ${categoryContent.seoBolumler.length} SEO bölümü`);
console.log(`ürün: ${product.name} (/urun/${SLUG}) · ${options.length} seçenek (${EBATLAR.length} ebat × ${KADEMELER.length} adet) · ${prices.length} fiyat satırı · görsel: ${IMAGE_PATH ?? "(mevcut korunur)"}`);
if (DRY) { console.log("\n[DRY] hiçbir şey yazılmadı"); process.exit(0); }

// ---- Yazma ----
const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
if (!email || !password) { console.error("ADMIN_EMAIL + ADMIN_PASSWORD gerekli."); process.exit(1); }
const login = await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
if (!login.ok) { console.error("Giriş başarısız:", login.status); process.exit(1); }
const lj = await login.json();
const TOKEN = lj.accessToken || lj.access_token || lj.token;
const H = { "content-type": "application/json", authorization: `Bearer ${TOKEN}` };
const fail = async (ad, r) => { console.error(`✗ ${ad}:`, r.status, (await r.text()).slice(0, 300)); process.exit(1); };

let imageUrl = null;
if (IMAGE_PATH) {
  const buf = await readFile(IMAGE_PATH);
  const fd = new FormData();
  fd.append("file", new Blob([buf], { type: "image/webp" }), basename(IMAGE_PATH));
  const up = await fetch(`${API}/api/uploads`, { method: "POST", headers: { authorization: `Bearer ${TOKEN}` }, body: fd });
  if (!up.ok) await fail("görsel yükleme", up);
  imageUrl = (await up.json()).url;
  console.log("✓ görsel yüklendi:", imageUrl);
}

// Kategori
let cat = await fetch(`${API}/api/categories/${CAT_SLUG}`).then((r) => (r.ok ? r.json() : null));
if (!cat?.id) {
  if (!imageUrl) { console.error("İlk kurulumda --image <webp> zorunlu (kategori imageUrl)."); process.exit(1); }
  const r = await fetch(`${API}/api/categories`, { method: "POST", headers: H, body: JSON.stringify({ ...category, imageUrl }) });
  if (!r.ok) await fail("kategori oluşturma", r);
  cat = await r.json(); console.log("✓ kategori oluşturuldu:", cat.id);
} else console.log("mevcut kategori güncelleniyor:", cat.id);
{
  const { slug: _s, ...rest } = category;
  const r = await fetch(`${API}/api/categories/${cat.id}`, { method: "PATCH", headers: H, body: JSON.stringify({ ...rest, ...(imageUrl ? { imageUrl } : {}), content: categoryContent }) });
  if (!r.ok) await fail("kategori içerik", r);
}

// Ürün
let mevcut = await fetch(`${API}/api/products/${SLUG}`).then((r) => (r.ok ? r.json() : null));
let id = mevcut?.id;
if (!id) {
  if (!imageUrl) { console.error("İlk kurulumda --image <webp> zorunlu (ürün görseli)."); process.exit(1); }
  const r = await fetch(`${API}/api/products`, { method: "POST", headers: H, body: JSON.stringify({ ...product, categoryId: cat.id, images: [imageUrl] }) });
  if (!r.ok) await fail("ürün oluşturma", r);
  id = (await r.json()).id; console.log("✓ ürün oluşturuldu:", id);
} else console.log("mevcut ürün güncelleniyor:", id);
const oR = await fetch(`${API}/api/products/${id}/options`, { method: "PUT", headers: H, body: JSON.stringify({ options }) });
if (!oR.ok) await fail("seçenek", oR);
const pR = await fetch(`${API}/api/products/${id}/prices`, { method: "PUT", headers: H, body: JSON.stringify({ prices }) });
if (!pR.ok) await fail("fiyat", pR);
{
  const { slug: _s, ...rest } = product;
  const r = await fetch(`${API}/api/products/${id}`, { method: "PATCH", headers: H, body: JSON.stringify({ ...rest, categoryId: cat.id, ...(imageUrl ? { images: [imageUrl] } : {}), pricingMode: "additive", content: productContent }) });
  if (!r.ok) await fail("ürün patch", r);
}

// Canlı doğrulama: API'nin döndürdüğü seçenek/fiyatlarla aynı motor
const yeni = await fetch(`${API}/api/products/${SLUG}`).then((r) => r.json());
const Y = { opts: yeni.options.map((o) => ({ ...o, rules: o.rules ?? null })), rows: yeni.prices.map((r) => ({ groupKey: r.groupKey, optionKey: r.optionKey, dimKey: r.dimKey, price: Number(r.price), cost: r.cost == null ? null : Number(r.cost) })) };
let canliHata = 0;
for (const e of EBATLAR) for (const n of [MIN_ADET, 10, 100]) {
  const v = computeConfiguredPrice(Y.opts, Y.rows, { ebat: e.key, adet: String(n) });
  if (Math.abs(v - e.tl * n) > 0.001) { canliHata++; console.log(`✗ canlı ${e.key} ×${n}: ${v} (beklenen ${e.tl * n})`); }
}
console.log(`\ncanlı: pricingMode ${yeni.pricingMode} · displayPrice ${yeni.displayPrice} · ${yeni.options.length} seçenek · ${yeni.prices.length} satır · ${canliHata ? "DOĞRULAMA BAŞARISIZ" : "✓ fiyatlar birebir"}`);
console.log(`→ https://markala.com.tr/kategori/${CAT_SLUG}\n→ https://markala.com.tr/urun/${SLUG}\n(storefront ISR 300 sn; anında görmek için admin panelden ürünü kaydet ya da /api/revalidate tetikle)`);
