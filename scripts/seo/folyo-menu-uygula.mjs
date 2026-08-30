#!/usr/bin/env node
/**
 * HEADER MENÜ — folyo bölmesinin menüye yansıtılması (2026-08-31, kullanıcı onaylı).
 *
 * 1) Dijital Baskı > "Folyo & Film": 6 yeni malzeme ürünü eklenir (Folyo Çeşitleri KALIR).
 * 2) İSG Uyarı Levhaları > "İş Güvenliği Levhaları": Lümen folyo, Acil Durum satırının
 *    hemen altına eklenir (acil çıkış / yangın işaretlerinde kullanılan malzeme).
 *
 * GÜVENLİK: yazmadan önce mevcut menü header_nav_yedek_<zaman> anahtarına yedeklenir;
 * yazımdan sonra DOKUNULMAYAN menülerin byte düzeyinde değişmediği doğrulanır.
 *
 * Kullanım: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/seo/folyo-menu-uygula.mjs [--dry]
 */

const API = process.env.API_URL || "https://api.markala.com.tr";
const DRY = process.argv.includes("--dry");
const DAMGA = process.env.YEDEK_DAMGA; // deterministik yedek anahtarı (dışarıdan verilir)

const YENI_FOLYO = [
  { label: "Kesim Folyo (Yapışkanlı)", href: "/urun/kesim-folyo" },
  { label: "Kumlama (Buzlu) Cam Folyosu", href: "/urun/kumlama-buzlu-cam-folyosu" },
  { label: "Şeffaf Folyo", href: "/urun/seffaf-folyo" },
  { label: "Laminasyonlu Folyo", href: "/urun/laminasyonlu-folyo" },
  { label: "Reflektif Folyo", href: "/urun/reflektif-folyo" },
  { label: "Lümen (Fotolüminesan) Folyo", href: "/urun/lumen-folyo" },
];
const ISG_LUMEN = { label: "Lümen Folyo (Acil Çıkış)", href: "/urun/lumen-folyo" };

async function girisYap() {
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
  if (!email || !password) { console.error("ADMIN_EMAIL + ADMIN_PASSWORD gerekli."); process.exit(1); }
  const r = await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
  if (!r.ok) { console.error(`Giriş başarısız: ${r.status}`); process.exit(1); }
  const j = await r.json();
  return j.accessToken || j.access_token || j.token;
}

const token = await girisYap();
const H = { "content-type": "application/json", authorization: `Bearer ${token}` };

const ham = await fetch(`${API}/api/settings/header-nav`).then((r) => r.json());
const nav = Array.isArray(ham) ? ham : typeof ham === "string" ? JSON.parse(ham) : ham.value;
if (!Array.isArray(nav) || nav.length === 0) { console.error("Menü okunamadı — DURDURULDU."); process.exit(1); }

// Dokunulmayacak menülerin ÖNCEKİ hâli (byte karşılaştırması için)
const ONCEKI = new Map(nav.map((c) => [c.label, JSON.stringify(c)]));
const DOKUNULAN = new Set();

// --- 1) Dijital Baskı > Folyo & Film ---
const dijital = nav.find((c) => /Dijital/i.test(c.label));
if (!dijital) { console.error("Dijital Baskı menüsü yok — DURDURULDU."); process.exit(1); }
const folyoGrup = (dijital.groups || []).find((g) => /Folyo/i.test(g.title || ""));
if (!folyoGrup) { console.error("Folyo & Film grubu yok — DURDURULDU."); process.exit(1); }

const mevcutHref = new Set(folyoGrup.items.map((i) => i.href));
const eklenecek = YENI_FOLYO.filter((i) => !mevcutHref.has(i.href));
// Araç Sticker ilk sırada kalsın, yeniler onun ardına; kalan eski öğeler sonda.
const aracIdx = folyoGrup.items.findIndex((i) => /arac-sticker/.test(i.href));
const kes = aracIdx >= 0 ? aracIdx + 1 : 0;
folyoGrup.items = [...folyoGrup.items.slice(0, kes), ...eklenecek, ...folyoGrup.items.slice(kes)];
DOKUNULAN.add(dijital.label);

// --- 2) İSG > İş Güvenliği Levhaları > Acil Durum altına lümen folyo ---
const isg = nav.find((c) => /İSG|ISG|Güvenlik/i.test(c.label));
if (!isg) { console.error("İSG menüsü yok — DURDURULDU."); process.exit(1); }
const isgGrup = (isg.groups || []).find((g) => /İş Güvenliği Levhaları/i.test(g.title || ""));
if (!isgGrup) { console.error("İSG ana grubu yok — DURDURULDU."); process.exit(1); }
if (!isgGrup.items.some((i) => i.href === ISG_LUMEN.href)) {
  const acilIdx = isgGrup.items.findIndex((i) => /acil-ilk-yardim/.test(i.href));
  const yer = acilIdx >= 0 ? acilIdx + 1 : isgGrup.items.length;
  isgGrup.items = [...isgGrup.items.slice(0, yer), ISG_LUMEN, ...isgGrup.items.slice(yer)];
}
DOKUNULAN.add(isg.label);

console.log("== Dijital Baskı > Folyo & Film ==");
folyoGrup.items.forEach((i) => console.log(`   ${eklenecek.some((e) => e.href === i.href) ? "+" : " "} ${i.label}  ${i.href}`));
console.log("\n== İSG > İş Güvenliği Levhaları ==");
isgGrup.items.forEach((i) => console.log(`   ${i.href === ISG_LUMEN.href ? "+" : " "} ${i.label}  ${i.href}`));

if (DRY) { console.log("\n[DRY] yazılmadı."); process.exit(0); }

// --- Yedek ---
const yedekKey = `header_nav_yedek_${DAMGA || "folyo"}`;
const yedekNav = Array.from(ONCEKI.values()).map((j) => JSON.parse(j));
const yed = await fetch(`${API}/api/settings`, { method: "PATCH", headers: H, body: JSON.stringify({ group: "header", values: { [yedekKey]: yedekNav } }) });
if (!yed.ok) { console.error(`✗ YEDEK ALINAMADI (${yed.status}) — menüye dokunulmadı.`); process.exit(1); }
console.log(`\n✓ yedek: ${yedekKey}`);

// --- Yazma ---
const w = await fetch(`${API}/api/settings`, { method: "PATCH", headers: H, body: JSON.stringify({ group: "header", values: { header_nav: nav } }) });
if (!w.ok) { console.error(`✗ yazılamadı: ${w.status} ${(await w.text()).slice(0, 200)}`); process.exit(1); }

// --- Doğrulama ---
const son = await fetch(`${API}/api/settings/header-nav`).then((r) => r.json()).then((x) => (Array.isArray(x) ? x : typeof x === "string" ? JSON.parse(x) : x.value));
let hata = 0;
for (const [label, oncekiJson] of ONCEKI) {
  if (DOKUNULAN.has(label)) continue;
  const simdi = son.find((c) => c.label === label);
  if (JSON.stringify(simdi) !== oncekiJson) { console.error(`✗ DOKUNULMAMASI GEREKEN MENÜ DEĞİŞTİ: ${label}`); hata++; }
}
const sonFolyo = son.find((c) => /Dijital/i.test(c.label))?.groups?.find((g) => /Folyo/i.test(g.title));
for (const y of YENI_FOLYO) if (!sonFolyo?.items?.some((i) => i.href === y.href)) { console.error(`✗ folyo menüsünde yok: ${y.label}`); hata++; }
if (!sonFolyo?.items?.some((i) => /folyo-cesitleri/.test(i.href))) { console.error("✗ Folyo Çeşitleri kayboldu (kalması gerekiyordu)"); hata++; }
const sonIsg = son.find((c) => /İSG|ISG|Güvenlik/i.test(c.label))?.groups?.find((g) => /İş Güvenliği Levhaları/i.test(g.title));
if (!sonIsg?.items?.some((i) => i.href === ISG_LUMEN.href)) { console.error("✗ İSG menüsünde lümen folyo yok"); hata++; }
if (son.length !== nav.length) { console.error(`✗ menü sayısı değişti: ${nav.length} → ${son.length}`); hata++; }

console.log(hata === 0 ? "\n✓ Doğrulandı — dokunulmayan menüler bozulmadı, yeni öğelerin tamamı yerinde." : `\n✗ ${hata} sorun — yedek: ${yedekKey}`);
process.exit(hata === 0 ? 0 : 1);
