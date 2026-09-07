#!/usr/bin/env node
/**
 * "Arkası Gri Folyo" ayrı ürün (2026-09-07, Hasan: "arkası gri folyo ayrı bir ürün olmalı,
 * buradan arkası gri seçenekleri kalkmalı").
 *
 * Ne yapar (idempotent):
 *  1. /urun/arkasi-gri-folyo ürününü kesim-folyo'dan klonlar (aynı kategori, m² modeli, görseller);
 *     malzeme grubu yalnız "Arkası Gri Folyo" + "Arkası Gri Mat Folyo", ek işlem grubu aynen.
 *     Maliyetler kesim-folyo'daki CANLI satırlardan okunur (elle yazılmaz).
 *  2. kesim-folyo'dan arkası gri seçenekleri + fiyat satırları kaldırılır; açıklama/SEO/SSS
 *     metinleri "normal ve mat" olarak sadeleştirilir, ilgili ürünlere yeni ürün eklenir.
 *  3. Header menüsü (site_settings.header_nav): "Dijital Baskı › Folyo & Film" içindeki KIRIK
 *     /urun/folyo bağlantısı /urun/kesim-folyo'ya çevrilir, etiketi ürünün güncel adı olur,
 *     hemen altına "Arkası Gri Folyo" eklenir; "Sektörel › Emlak" etiketi de güncellenir.
 *
 * Kullanım:
 *   ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/katalog/arkasi-gri-folyo.mjs --dry
 *   ADMIN_EMAIL=… ADMIN_PASSWORD=… node scripts/katalog/arkasi-gri-folyo.mjs
 * Kimlik: Projects\markala-google\.env içindeki ADMIN_* (dotenv ile yüklenir).
 */
import { readFileSync } from "node:fs";
// Kimlik: markala-google/.env (dotenv bağımlılığı olmadan, yalnız ADMIN_* satırları)
const ENV_DOSYA = "C:/Users/Administrator/Projects/markala-google/.env";
try {
  for (const l of readFileSync(ENV_DOSYA, "utf8").split(String.fromCharCode(10))) {
    const m = /^(ADMIN_EMAIL|ADMIN_PASSWORD|API_URL)=(.*)$/.exec(l.replace(String.fromCharCode(13), ""));
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
  }
} catch { /* env dışarıdan verilir */ }

const API = process.env.API_URL || "https://api.markala.com.tr";
const DRY = process.argv.includes("--dry");
const KAYNAK = "kesim-folyo";
const SLUG = "arkasi-gri-folyo";
const GRI_KEYS = new Set(["arkasi-gri-folyo", "arkasi-gri-mat-folyo"]);

const getJson = async (p) => { const r = await fetch(`${API}/api${p}`); return r.ok ? r.json() : null; };
const temizOpt = ({ id: _i, productId: _p, createdAt: _c, updatedAt: _u, ...o }) => ({ ...o, rules: o.rules ?? undefined, optionSublabel: o.optionSublabel ?? undefined });
const temizRow = (r) => ({ groupKey: r.groupKey ?? undefined, optionKey: r.optionKey ?? undefined, dimKey: r.dimKey ?? undefined, price: Number(r.price), cost: r.cost == null ? undefined : Number(r.cost) });

const kaynak = await getJson(`/products/${KAYNAK}`);
if (!kaynak?.id) { console.error(`kaynak ürün yok: ${KAYNAK}`); process.exit(1); }
const kOpts = kaynak.options.map(temizOpt), kRows = kaynak.prices.map(temizRow);
const griOpts = kOpts.filter((o) => o.groupKey !== "malzeme" || GRI_KEYS.has(o.optionKey)).map((o) => (o.groupKey === "malzeme" ? { ...o, optionSort: o.optionKey === "arkasi-gri-folyo" ? 0 : 1 } : o));
const griRows = kRows.filter((r) => r.groupKey !== "malzeme" || GRI_KEYS.has(r.optionKey));
const kalanOpts = kOpts.filter((o) => !(o.groupKey === "malzeme" && GRI_KEYS.has(o.optionKey))).map((o) => (o.groupKey === "malzeme" ? { ...o, optionSort: o.optionKey === "normal-folyo" ? 0 : 1 } : o));
const kalanRows = kRows.filter((r) => !(r.groupKey === "malzeme" && GRI_KEYS.has(r.optionKey)));
if (griRows.filter((r) => r.groupKey === "malzeme").length !== 2) { console.error("kaynakta 2 arkası gri fiyat satırı bekleniyordu:", griRows); process.exit(1); }

// ---- Yeni ürün metinleri ----
const yeni = {
  slug: SLUG,
  name: "Arkası Gri Folyo",
  shortDescription: "Sırtı gri, ışık geçirmeyen kendinden yapışkanlı kesim folyosu — eski yazı üstü kaplama ve koyu zeminler için; parlak ve mat seçenekleri.",
  description: "Arkası gri folyo, sırtındaki gri katman sayesinde alttaki yüzeyin veya eski yazının folyodan geçip görünmesini engelleyen kendinden yapışkanlı kesim folyosudur. Koyu ya da desenli zeminlere açık renk uygulama yapılacağında ve eski tabela veya vitrin folyosunun üzerine kaplama yapılacağında tercih edilir. Parlak ve mat yüzey seçenekleriyle m² fiyatlı üretilir; plotter kesim harf ve logo uygulamalarında kullanılır.",
  productionTime: kaynak.productionTime || "2-3 iş günü",
  sizeLabel: kaynak.sizeLabel || "m² hesabı",
  images: kaynak.images,
  badges: [],
  bestseller: false,
  isActive: true,
};
const yeniContent = {
  brand: "Markala",
  seo: {
    title: "Arkası Gri Folyo — Işık Geçirmeyen Kesim Folyosu (m² Fiyat)",
    description: "Arkası gri yapışkanlı kesim folyo: eski yazı ve koyu zemin üstüne kaplama için ışık geçirmez sırt. Parlak ve mat seçenek, plotter kesim, m² fiyat, KDV dahil.",
  },
  faqs: [
    { q: "Arkası gri folyo ne işe yarar?", a: "Sırtındaki gri katman, alttaki yüzeyin veya eski yazının folyodan geçerek görünmesini engeller. Koyu ya da desenli zeminlere açık renk uygulama yapılacağında ve eski folyonun üzerine kaplama yapılacak durumlarda normal folyo yerine bu tercih edilir." },
    { q: "Parlak mı mat mı seçmeliyim?", a: "Mat yüzey ışığı dağıtır, yansıma yapmaz; vitrin ve iç mekân camlarında yazının her açıdan okunmasını sağlar. Parlak yüzey renkleri daha canlı gösterir ve dış mekânda daha uzun süre temiz kalır. Her ikisinin de arkası gridir, ışık geçirmezlik aynıdır." },
    { q: "Fiyat nasıl hesaplanıyor?", a: "Metrekare üzerinden: en (cm) × boy (cm) ÷ 10.000 = m². Seçilen folyonun m² fiyatı bu alanla çarpılır; toplam alan 1 m²'nin altında kalırsa minimum 1 m² uygulanır. Laminasyon ve iç mekân baskı, ek işlem seçeneğinden adet başına eklenir." },
    { q: "Normal folyodan farkı ne?", a: "Normal (beyaz sırtlı) folyo açık ve düz zeminlerde yeterlidir; ışık geçirgenliği vardır. Arkası gri folyo, üstüne uygulandığı zeminin rengini ve altındaki eski yazıyı tamamen kapatır. Zemin sorunlu değilse daha ekonomik olan Folyo (Yapışkanlı Folyo) ürününü seçebilirsiniz." },
  ],
  relatedSlugs: [KAYNAK, "seffaf-folyo", "laminasyonlu-folyo", "kumlama-buzlu-cam-folyosu"],
};

// ---- Kaynak ürün metin sadeleştirme ----
const kaynakContent = structuredClone(kaynak.content || {});
kaynakContent.seo = { ...(kaynakContent.seo || {}), description: "Kendinden yapışkanlı kesim folyo: vitrin yazısı, logo ve yönlendirme için normal ve mat seçenekleri. Plotter kesim, m² fiyatlandırma, KDV dahil." };
kaynakContent.faqs = (kaynakContent.faqs || []).map((f) => (/arkası gri/i.test(f.q)
  ? { q: f.q, a: "Arkası gri folyonun sırtındaki gri katman, alttaki yüzeyin veya eski yazının folyodan geçerek görünmesini engeller; koyu zeminler ve eski folyo üzerine kaplama için kullanılır. Bu seçenek ayrı bir ürün olarak Arkası Gri Folyo sayfasından, parlak veya mat yüzeyle sipariş edilir." }
  : f));
kaynakContent.relatedSlugs = [SLUG, ...(kaynakContent.relatedSlugs || []).filter((s) => s !== SLUG)];
const kaynakDescription = "Kesim folyo, plotter ile harf ve logo formunda kesilerek cam, duvar, araç ve tabela yüzeylerine uygulanan kendinden yapışkanlı folyodur. Zemin rengi yüzeyin kendisi olduğu için sonuç sade ve kurumsal görünür. Normal ve mat seçenekleriyle m² fiyatlı üretilir; ışık geçirmeyen sırt isteniyorsa Arkası Gri Folyo ayrı üründür.";

// ---- Menü ----
const nav = await getJson("/settings/header-nav");
let navDegisti = false;
if (Array.isArray(nav)) {
  for (const c of nav) for (const g of c.groups || []) {
    const items = g.items || [];
    const i = items.findIndex((it) => it.href === "/urun/folyo" || it.href === `/urun/${KAYNAK}`);
    if (i < 0) continue;
    const dogru = { href: `/urun/${KAYNAK}`, label: kaynak.name };
    if (items[i].href !== dogru.href || items[i].label !== dogru.label) { items[i] = dogru; navDegisti = true; }
    if (/folyo/i.test(g.title) && !items.some((it) => it.href === `/urun/${SLUG}`)) { items.splice(i + 1, 0, { href: `/urun/${SLUG}`, label: yeni.name }); navDegisti = true; }
    g.items = items;
  }
}

console.log(`kaynak: ${kaynak.name} (${kaynak.id}) · ${kOpts.length} seçenek → ${kalanOpts.length} kalır · ${kRows.length} satır → ${kalanRows.length} kalır`);
console.log(`yeni: ${yeni.name} (/urun/${SLUG}) · ${griOpts.length} seçenek · ${griRows.length} satır · maliyet:`, griRows.map((r) => `${r.optionKey}=${r.cost}`).join(", "));
console.log("yeni seçenekler:", griOpts.map((o) => `${o.groupKey}/${o.optionKey}#${o.optionSort}`).join(" "));
console.log(`menü: ${navDegisti ? "değişecek" : "değişiklik yok"}`);
if (Array.isArray(nav)) for (const c of nav) for (const g of c.groups || []) if ((g.items || []).some((it) => /folyo/.test(it.href))) console.log(`  [${c.label} › ${g.title}]`, (g.items || []).filter((it) => /folyo/.test(it.href)).map((it) => `${it.label} → ${it.href}`).join(" | "));
if (DRY) { console.log("\n[DRY] hiçbir şey yazılmadı"); process.exit(0); }

// ---- Yazma ----
const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
if (!email || !password) { console.error("ADMIN_EMAIL + ADMIN_PASSWORD gerekli."); process.exit(1); }
const login = await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
if (!login.ok) { console.error("Giriş başarısız:", login.status); process.exit(1); }
const lj = await login.json();
const H = { "content-type": "application/json", authorization: `Bearer ${lj.accessToken || lj.access_token || lj.token}` };
const fail = async (ad, r) => { console.error(`✗ ${ad}:`, r.status, (await r.text()).slice(0, 300)); process.exit(1); };

// 1. yeni ürün
let mevcut = await getJson(`/products/${SLUG}`);
let id = mevcut?.id;
if (!id) {
  const r = await fetch(`${API}/api/products`, { method: "POST", headers: H, body: JSON.stringify({ ...yeni, categoryId: kaynak.categoryId, basePrice: 0, startingPrice: 0 }) });
  if (!r.ok) await fail("ürün oluşturma", r);
  id = (await r.json()).id; console.log("✓ ürün oluşturuldu:", id);
} else console.log("mevcut ürün güncelleniyor:", id);
let r = await fetch(`${API}/api/products/${id}/options`, { method: "PUT", headers: H, body: JSON.stringify({ options: griOpts }) });
if (!r.ok) await fail("yeni seçenek", r);
r = await fetch(`${API}/api/products/${id}/prices`, { method: "PUT", headers: H, body: JSON.stringify({ prices: griRows }) });
if (!r.ok) await fail("yeni fiyat", r);
{ const { slug: _s, ...rest } = yeni;
  r = await fetch(`${API}/api/products/${id}`, { method: "PATCH", headers: H, body: JSON.stringify({ ...rest, categoryId: kaynak.categoryId, pricingMode: "area", content: yeniContent }) });
  if (!r.ok) await fail("yeni ürün patch", r); }
console.log("✓ yeni ürün seçenek/fiyat/içerik yazıldı");

// 2. kaynak ürün sadeleştirme
r = await fetch(`${API}/api/products/${kaynak.id}/options`, { method: "PUT", headers: H, body: JSON.stringify({ options: kalanOpts }) });
if (!r.ok) await fail("kaynak seçenek", r);
r = await fetch(`${API}/api/products/${kaynak.id}/prices`, { method: "PUT", headers: H, body: JSON.stringify({ prices: kalanRows }) });
if (!r.ok) await fail("kaynak fiyat", r);
r = await fetch(`${API}/api/products/${kaynak.id}`, { method: "PATCH", headers: H, body: JSON.stringify({ description: kaynakDescription, content: kaynakContent }) });
if (!r.ok) await fail("kaynak patch", r);
console.log("✓ kaynak üründen arkası gri seçenekleri kaldırıldı");

// 3. menü
if (navDegisti) {
  r = await fetch(`${API}/api/settings`, { method: "PATCH", headers: H, body: JSON.stringify({ group: "header", values: { header_nav: nav } }) });
  if (!r.ok) await fail("menü", r);
  console.log("✓ menü güncellendi");
}

// Canlı doğrulama
const [y, k] = await Promise.all([getJson(`/products/${SLUG}`), getJson(`/products/${KAYNAK}`)]);
console.log(`\ncanlı yeni: ${y.name} · displayPrice ${y.displayPrice} · malzeme: ${y.options.filter((o) => o.groupKey === "malzeme").map((o) => o.optionKey).join(",")} · ${y.prices.length} satır`);
console.log(`canlı kaynak: ${k.name} · displayPrice ${k.displayPrice} · malzeme: ${k.options.filter((o) => o.groupKey === "malzeme").map((o) => o.optionKey).join(",")} · ${k.prices.length} satır`);
console.log(`→ https://markala.com.tr/urun/${SLUG}\n→ https://markala.com.tr/urun/${KAYNAK}`);
