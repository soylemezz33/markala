#!/usr/bin/env node
/**
 * "Ayaklı Dekota Baskı" ürünü — dekota-baski-5mm'in birebir kopyası + adet başına 400 ₺ ayak ücreti
 * (2026-09-04, Hasan talebi: "dekota baskı fiyatlandırması + 400 TL, ayaklar ek ücret").
 *
 * Yöntem: kaynak ürünün seçenek/fiyat/içerik/görselleri kopyalanır; "ayak" adlı KİLİTLİ (locked)
 * tek seçenekli ücretli grup eklenir: rules {effect:"perPiece", birim:"tl"}, satır cost 400 →
 * motor 400 ₺ × adet ekler (m² hesabı, minimum alan ve CNC kuralı aynen korunur).
 * locked=true → müşteri seçmez, web ve sunucu grubu otomatik uygular (effectiveSelections).
 *
 * Kullanım: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/katalog/ayakli-dekota.mjs [--dry]
 */
const API = process.env.API_URL || "https://api.markala.com.tr";
const DRY = process.argv.includes("--dry");
const KAYNAK = "dekota-baski-5mm";
const SLUG = "ayakli-dekota-baski";
const AYAK_TL = 400;

const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
if (!email || !password) { console.error("ADMIN_EMAIL + ADMIN_PASSWORD gerekli."); process.exit(1); }
const login = await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
if (!login.ok) { console.error("Giriş başarısız:", login.status); process.exit(1); }
const lj = await login.json(); const H = { "content-type": "application/json", authorization: `Bearer ${lj.accessToken || lj.access_token || lj.token}` };

const kaynak = await fetch(`${API}/api/products/${KAYNAK}`).then((r) => r.json());
if (!kaynak?.id) { console.error("kaynak ürün yok"); process.exit(1); }
const mevcut = await fetch(`${API}/api/products/${SLUG}`).then((r) => (r.ok ? r.json() : null));

const options = [
  ...kaynak.options.map((o) => ({
    groupKey: o.groupKey, groupLabel: o.groupLabel, groupRole: o.groupRole, groupSort: o.groupSort,
    optionKey: o.optionKey, optionLabel: o.optionLabel, optionSort: o.optionSort,
    ...(o.optionSublabel ? { optionSublabel: o.optionSublabel } : {}),
    ...(o.description ? { description: o.description } : {}),
    ...(o.rules ? { rules: o.rules } : {}), locked: !!o.locked,
  })),
  { groupKey: "ayak", groupLabel: "Ayaklı Stand", groupRole: "priced", groupSort: 3, optionKey: "cift-ayak", optionLabel: "Çift Ayaklı Stand (dahil)", optionSort: 0, locked: true, rules: { effect: "perPiece", birim: "tl" }, description: `Her levha için çift ayaklı stand dahildir (adet başına ${AYAK_TL} ₺).` },
];
const prices = [
  ...kaynak.prices.map((p) => ({ groupKey: p.groupKey, optionKey: p.optionKey, ...(p.dimKey ? { dimKey: p.dimKey } : {}), ...(p.cost != null ? { cost: Number(p.cost) } : {}), price: Number(p.price ?? 0) })),
  { groupKey: "ayak", optionKey: "cift-ayak", cost: AYAK_TL, price: 0 },
];
const description = `Dekota Baskı ürünümüzün çift ayaklı stand dahil hâli: 3-10 mm beyaz dekota plaka üzerine UV baskı, her levhayla birlikte ayakta duran çift ayaklı stand gelir. Mağaza içi yönlendirme, fuar ve etkinlik panosu, kampanya totemi, vitrin önü ve resepsiyon tanıtımı için kutudan çıkıp kurulur; duvara montaj gerektirmez. Düz kesim veya CNC lazer ile özel form kesim seçenekleriyle, m² hesabı bazında 30-305 cm aralığında istediğiniz ebatta üretilir. Fiyat, dekota baskı m² hesabına adet başına ayak ücreti eklenerek oluşur.\n\nLütfen Dikkat: Siparişlerinizin Renk, Adet ve Ölçülerinde %1 ila %5 arasında fire olabilmektedir.`;
const content = {
  ...(kaynak.content || {}),
  sku: kaynak.content?.sku ? `${kaynak.content.sku}-AYAK` : undefined,
  seo: {
    title: "Ayaklı Dekota Baskı — Çift Ayaklı Stand Dahil UV Baskılı Dekota, Özel Ölçü",
    keywords: ["ayaklı dekota", "ayaklı tabela", "dekota stand", "ayaklı pano", "fuar panosu", "dekota baskı", "uv baskı"],
    description: "Çift ayaklı stand dahil dekota baskı: 3-10 mm beyaz dekota üzerine UV baskı, istediğiniz ölçüde m² hesabı + adet başına ayak ücreti. Fuar, mağaza ve etkinlik panosu için kutudan çıkıp kurulur.",
  },
  relatedSlugs: [KAYNAK, ...(kaynak.content?.relatedSlugs || []).filter((s) => s !== KAYNAK)].slice(0, 6),
  bestsellerRank: undefined,
};
Object.keys(content).forEach((k) => content[k] === undefined && delete content[k]);

console.log(`kaynak: ${kaynak.name} (${kaynak.id}) · ${kaynak.options.length} seçenek · ${kaynak.prices.length} fiyat satırı`);
console.log(`hedef: ${SLUG} · ${options.length} seçenek · ${prices.length} fiyat satırı · ayak ${AYAK_TL} ₺/adet (kilitli grup)`);
if (DRY) { console.log("[DRY] yazılmadı"); process.exit(0); }

let id = mevcut?.id;
if (!id) {
  const cr = await fetch(`${API}/api/products`, { method: "POST", headers: H, body: JSON.stringify({
    name: "Ayaklı Dekota Baskı", slug: SLUG, categoryId: kaynak.categoryId,
    shortDescription: "Çift ayaklı stand dahil dekota UV baskı, m² fiyat + ayak", description,
    basePrice: 0, productionTime: kaynak.productionTime, sizeLabel: kaynak.sizeLabel,
    images: kaynak.images ?? [], badges: [], isActive: true }) });
  if (!cr.ok) { console.error("✗ oluşturulamadı:", cr.status, (await cr.text()).slice(0, 200)); process.exit(1); }
  id = (await cr.json()).id; console.log("✓ ürün oluşturuldu:", id);
} else console.log("mevcut ürün güncelleniyor:", id);
const oR = await fetch(`${API}/api/products/${id}/options`, { method: "PUT", headers: H, body: JSON.stringify({ options }) });
if (!oR.ok) { console.error("✗ seçenek:", oR.status, (await oR.text()).slice(0, 200)); process.exit(1); }
const pR = await fetch(`${API}/api/products/${id}/prices`, { method: "PUT", headers: H, body: JSON.stringify({ prices }) });
if (!pR.ok) { console.error("✗ fiyat:", pR.status, (await pR.text()).slice(0, 200)); process.exit(1); }
const paR = await fetch(`${API}/api/products/${id}`, { method: "PATCH", headers: H, body: JSON.stringify({ pricingMode: "area", description, content }) });
if (!paR.ok) { console.error("✗ patch:", paR.status, (await paR.text()).slice(0, 200)); process.exit(1); }

// Doğrulama: aynı motorla kaynak ve hedef fiyatı karşılaştır
const { computeAreaLine } = await import("file:///C:/Users/Administrator/Desktop/markala/apps/api/src/orders/pricing.ts");
const pricing = await fetch(`${API}/api/settings/pricing`).then((r) => r.json());
const yeni = await fetch(`${API}/api/products/${SLUG}`).then((r) => r.json());
const map = (p) => ({ opts: p.options.map((o) => ({ ...o, rules: o.rules ?? null })), rows: p.prices.map((r) => ({ groupKey: r.groupKey, optionKey: r.optionKey, dimKey: r.dimKey, price: Number(r.price), cost: r.cost == null ? null : Number(r.cost) })) });
const K = map(kaynak), Y = map(yeni);
console.log(`\ndoğrulama (pricingMode ${yeni.pricingMode}, displayPrice ${yeni.displayPrice}, seçenek ${yeni.options.length}, satır ${yeni.prices.length}):`);
let hata = 0;
for (const [en, boy, adet, mal, ek] of [["100", "100", 1, "dekota-5mm", "yok"], ["100", "100", 2, "dekota-5mm", "yok"], ["50", "70", 1, "dekota-3mm", "yok"], ["200", "100", 3, "dekota-10mm", "cnc-kesim"]]) {
  const k = computeAreaLine(K.opts, K.rows, { malzeme: mal, ekislem: ek, en, boy }, adet, pricing).lineTotal;
  const y = computeAreaLine(Y.opts, Y.rows, { malzeme: mal, ekislem: ek, en, boy, ayak: "cift-ayak" }, adet, pricing).lineTotal;
  const ok = Math.abs(y - (k + AYAK_TL * adet)) < 0.01; if (!ok) hata++;
  console.log(`  ${ok ? "✓" : "✗"} ${mal} ${en}×${boy} ×${adet} ${ek}: dekota ${k} ₺ → ayaklı ${y} ₺ (fark ${(y - k).toFixed(2)})`);
}
console.log(hata ? "\nDOĞRULAMA BAŞARISIZ" : `\n✓ https://markala.com.tr/urun/${SLUG}`);
