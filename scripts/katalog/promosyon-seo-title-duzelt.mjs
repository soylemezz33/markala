#!/usr/bin/env node
/**
 * Promosyon SEO başlık backfill'i (17 Eyl 2026 denetim bulgusu).
 *
 * Sorun: ürün sayfası TITLE_MAX=60 bütçesi kullanıyor (" · Markala" şablonu); senkronun
 * ürettiği 61-65 karakterlik başlıklar (68 ürün) komple atılıp çıplak ürün adına düşüyordu.
 * Eşleme kuralı 60'a çekildi ama content yalnız ÜRÜN OLUŞTURULURKEN yazıldığından mevcut
 * kayıtlar kendiliğinden düzelmez — bu betik kayıtlı başlığı kademeli kısaltmayla düzeltir:
 *   1) " Promosyon" eki atılır  2) parantezli teknik ek atılır  3) ", N+ Adet" atılır.
 * Ek: features listesi BOŞ kalan ürünlerde (2 adet) ebat + baskı satırıyla doldurulur.
 *
 * Kullanım: node scripts/katalog/promosyon-seo-title-duzelt.mjs [--dry]
 */
import { readFileSync } from "node:fs";
const ENV_DOSYA = "C:/Users/Administrator/Projects/markala-google/.env";
try {
  for (const l of readFileSync(ENV_DOSYA, "utf8").split(String.fromCharCode(10))) {
    const m = /^(ADMIN_EMAIL|ADMIN_PASSWORD|API_URL)=(.*)$/.exec(l.replace(String.fromCharCode(13), ""));
    if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim().replace(/^"|"$/g, "");
  }
} catch {}
const API = process.env.API_URL || "https://api.markala.com.tr";
const DRY = process.argv.includes("--dry");

function kisalt(title) {
  const adaylar = [
    title,
    title.replace(" — Logo Baskılı Promosyon,", " — Logo Baskılı,"),
    title.replace(/\s*\([^)]*\)/g, ""),
    title.replace(/,\s*\d+\+\s*Adet\s*$/i, ""),
    title.replace(" — Logo Baskılı Promosyon,", " — Logo Baskılı,").replace(/,\s*\d+\+\s*Adet\s*$/i, ""),
    title.replace(/\s*\([^)]*\)/g, "").replace(/,\s*\d+\+\s*Adet\s*$/i, ""),
  ].map((s) => s.replace(/\s{2,}/g, " ").trim());
  return adaylar.find((a) => a.length <= 60) ?? adaylar[adaylar.length - 1];
}

const login = await fetch(`${API}/api/auth/login`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD }),
});
if (!login.ok) { console.error("giriş başarısız", login.status); process.exit(1); }
const lj = await login.json();
const H = { "content-type": "application/json", authorization: `Bearer ${lj.accessToken || lj.access_token}` };

// Slug listesi: DB dökümü (denetim jsonl'ı) — admin-list sayfalı olduğundan kullanılmaz.
const jsonlYolu = process.argv.find((a) => a.endsWith(".jsonl"));
if (!jsonlYolu) { console.error("kullanım: ... <canli-urunler.jsonl> [--dry]"); process.exit(1); }
const adaylar = readFileSync(jsonlYolu, "utf8")
  .split(String.fromCharCode(10))
  .filter((l) => l.trim().startsWith("{"))
  .map((l) => JSON.parse(l));
console.log("promosyon ürünü:", adaylar.length);

let titleDuzeltilen = 0, featDolduruldu = 0, hata = 0;
for (const oz of adaylar) {
  const p = await (await fetch(`${API}/api/products/${oz.slug}`)).json();
  const c = p.content ?? {};
  const eskiTitle = c.seo?.title ?? "";
  let degisti = false;
  if (eskiTitle.length > 60) {
    const yeni = kisalt(eskiTitle);
    if (yeni !== eskiTitle) {
      c.seo = { ...c.seo, title: yeni };
      degisti = true;
      titleDuzeltilen++;
      if (titleDuzeltilen <= 6 || DRY) console.log(`  ${p.slug}\n    ${eskiTitle.length}: ${eskiTitle}\n    ${yeni.length}: ${yeni}`);
    }
  }
  if (!Array.isArray(c.features) || c.features.length === 0) {
    const ebat = (c.specifications ?? []).find((s) => /ebat/i.test(s.label))?.value;
    c.features = [...(ebat ? [`Ebat: ${ebat}`] : []), "Firmanıza özel logo baskılı üretilir"];
    degisti = true;
    featDolduruldu++;
    console.log(`  features dolduruldu: ${p.slug}`);
  }
  if (!degisti || DRY) continue;
  const r = await fetch(`${API}/api/products/${p.id}`, {
    method: "PATCH",
    headers: H,
    body: JSON.stringify({ content: c }),
  });
  if (!r.ok) { hata++; console.error(`  ✗ ${p.slug}: ${r.status}`); }
}
console.log(`\ntitle düzeltilen: ${titleDuzeltilen} | features doldurulan: ${featDolduruldu} | hata: ${hata}${DRY ? " [DRY — yazılmadı]" : ""}`);
if (!DRY) console.log("Vitrin ISR ~300 sn içinde tazelenir.");
