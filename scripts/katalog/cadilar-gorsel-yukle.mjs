/**
 * Cadılar Bayramı ürün görselleri (2026-09-15, Hasan: "drivedeki görselleri sadece o alandaki
 * ürünlere ekle, orijinal ürünlerim bozulmasın").
 * Drive klasörü 1pmQXQBWyW7_Burq2rdZN9LKei3YGB0Hs → yerel dizin (markala-google/src/cadilar-drive-indir.mjs)
 * → POST /uploads (webp'e çevrilir) → YALNIZ cadilar-bayrami-* ürünlerinin images dizisi değiştirilir.
 * Klon ürünler taban ürünün görsel URL'lerini paylaşıyordu; dizi değişince taban ürün etkilenmez.
 * Kullanım: node scripts/katalog/cadilar-gorsel-yukle.mjs <dizin> [--dry]
 */
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";
const ENV_DOSYA = "C:/Users/Administrator/Projects/markala-google/.env";
try { for (const l of readFileSync(ENV_DOSYA, "utf8").split(String.fromCharCode(10))) { const m = /^(ADMIN_EMAIL|ADMIN_PASSWORD|API_URL)=(.*)$/.exec(l.replace(String.fromCharCode(13), "")); if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, ""); } } catch {}
const API = process.env.API_URL || "https://api.markala.com.tr";
const DRY = process.argv.includes("--dry");
const DIZIN = process.argv[2];
// Dosya adı anahtarı → ürün slug'ı (sıra: dosya adındaki -01, -02 …)
const ESLEME = {
  "amerikan servis": "cadilar-bayrami-amerikan-servis",
  "vitrin sticker seti": "cadilar-bayrami-vitrin-sticker",
  "branda": "cadilar-bayrami-branda-afis",
  "kâğıt afiş": "cadilar-bayrami-kagit-afis",
  "davetiye-elilanı": "cadilar-bayrami-davetiye",
  "rollup": "cadilar-bayrami-rollup",
  "fosforlu sticker": "cadilar-bayrami-fosforlu-sticker",
  "çanta": "cadilar-bayrami-kraft-canta",
  "ışıklı pano": "cadilar-bayrami-lightbox",
  // 15 Eyl akşamı, Downloads/halloween-02: eksik iki ürün + fosforlu 2. görsel
  "etiket": "cadilar-bayrami-etiket",
  "yelken bayrak": "cadilar-bayrami-yelken-bayrak",
};
// dekota-01/02 ayaklı figür (ayaklı bal kabağı), dekota-03/04 figür & tabela (görseller incelendi)
const OZEL = { "dekota-01": "cadilar-bayrami-ayakli-figur", "dekota-02": "cadilar-bayrami-ayakli-figur", "dekota-03": "cadilar-bayrami-dekota-figur", "dekota-04": "cadilar-bayrami-dekota-figur" };
const plan = new Map();
for (const f of readdirSync(DIZIN).filter((x) => /\.png$/i.test(x)).sort()) {
  const ad = f.replace(/^Cadılar Bayramı /i, "").replace(/\.png$/i, "").toLocaleLowerCase("tr");
  const ozel = Object.keys(OZEL).find((k) => ad === k);
  const anahtar = ozel ? OZEL[ozel] : ESLEME[Object.keys(ESLEME).find((k) => ad.startsWith(k)) ?? ""];
  if (!anahtar) { console.log("⚠ eşleşmedi:", f); continue; }
  if (!plan.has(anahtar)) plan.set(anahtar, []);
  plan.get(anahtar).push(f);
}
for (const [slug, dosyalar] of plan) console.log(`${slug.padEnd(36)} ← ${dosyalar.join(" | ")}`);
if (DRY) { console.log("[DRY] yazılmadı"); process.exit(0); }
const login = await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }) });
if (!login.ok) { console.error("giriş başarısız", login.status); process.exit(1); }
const lj = await login.json(); const TOKEN = lj.accessToken || lj.access_token || lj.token;
for (const [slug, dosyalar] of plan) {
  const urun = await (await fetch(`${API}/api/products/${slug}`)).json();
  if (!urun?.id || !slug.startsWith("cadilar-bayrami-")) { console.error("ürün yok / kapsam dışı:", slug); continue; }
  const urls = [];
  for (const f of dosyalar) {
    const fd = new FormData(); fd.append("file", new Blob([readFileSync(join(DIZIN, f))], { type: "image/png" }), f);
    const r = await fetch(`${API}/api/uploads`, { method: "POST", headers: { authorization: `Bearer ${TOKEN}` }, body: fd });
    if (!r.ok) { console.error("✗ yükleme", f, r.status, (await r.text()).slice(0, 120)); process.exit(1); }
    const j = await r.json(); const url = j.url || j.publicUrl || (j.key ? `${API}/uploads/${j.key}` : null);
    if (!url) { console.error("✗ url yok", JSON.stringify(j).slice(0, 200)); process.exit(1); }
    urls.push(url.startsWith("http") ? url : `${API}${url}`);
  }
  const p = await fetch(`${API}/api/products/${urun.id}`, { method: "PATCH", headers: { authorization: `Bearer ${TOKEN}`, "content-type": "application/json" }, body: JSON.stringify({ images: urls }) });
  if (!p.ok) { console.error("✗ patch", slug, p.status, (await p.text()).slice(0, 200)); process.exit(1); }
  console.log(`✓ ${slug}: ${urls.length} görsel (eski ${urun.images?.length ?? 0} bağlantı yerine)`);
}
console.log("BİTTİ");
