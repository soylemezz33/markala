#!/usr/bin/env node
/**
 * Tedarikçi listesi ↔ CANLI SİTE karşılaştırması. SALT ANALİZ — hiçbir şey yazmaz.
 *
 * ÖNEMLİ MODELLEME FARKI: tedarikçi her ölçü+adet kombinasyonuna TEK KOD verir
 * (1CA7 = A7 1000 adet). Site ise `paket` (ölçü) × `adet` MATRİSİ kullanır — 4 ölçü ×
 * 4 adet = 16 fiyat satırı. Bu yüzden "kod başına" kıyas yanlış pozitif üretir;
 * doğru kıyas ÖLÇÜ KÜMESİ ve ADET KÜMESİ üzerinden yapılır.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const turmat = JSON.parse(fs.readFileSync(path.join(DIR, "turmat-urunler.json"), "utf8"));

const ESLEME = {
  "Kartvizit": ["klasik-kartvizit"], "Broşür": ["brosur"], "Pro Broşür": ["pro-brosur"],
  "Selefonlu Broşür": ["selefonlu-brosur"], "El ilanı": ["el-ilani"], "Afişler": ["afis-105gr"],
  "Antetli": ["antetli-kagit"], "Zarf": ["zarf-diplomat-tek-renk", "zarf-diplomat-renkli", "zarf-torba"],
  "Magnet": ["magnet-promosyon"], "Amerikan Servis": ["amerikan-servis"],
  "KAPI ASKI BROŞÜRLERİ": ["kapi-aski-brosur"], "Dosyalar": ["cepli-dosya"], "Etiket": ["etiket"],
  "Makbuz": ["makbuz"], "Oto Paspas": ["oto-paspas"], "Küp Bloknot": ["kup-bloknot"],
  "Spiralli Bloknot": ["spiralli-bloknot"], "Kapaklı Bloknot": ["kapakli-bloknot"],
  "Kapaksız Bloknot": ["kapaksiz-bloknot"], "NOTLUK": ["notluk"], "ÇANTALAR": ["canta"],
  "ÜRÜN KUTULARI": [],
};

// ── site verisi ──────────────────────────────────────────────────────────────
const opts = new Map(); // slug → [{grup, label, sub}]
for (const line of fs.readFileSync(path.join(DIR, "site-secenekler.txt"), "utf8").split("\n")) {
  const [slug, grup, label, sub] = line.trim().split("|");
  if (!slug) continue;
  if (!opts.has(slug)) opts.set(slug, []);
  opts.get(slug).push({ grup, label, sub: sub ?? "" });
}
const prods = new Map();
for (const l of fs.readFileSync(path.join(DIR, "site-urunler.txt"), "utf8").split("\n").filter(Boolean)) {
  const [slug, name, cat, fiyat] = l.trim().split("|");
  prods.set(slug, { name, cat, fiyat: Number(fiyat) });
}

/** "9.5x20 cm" / "9,5 × 20" → "9.5x20" (karşılaştırılabilir ölçü anahtarı) */
const olcuAnahtar = (s) => {
  // Kaynakta kâğıt boyu etiketi ve ölçü aynı metne yapışabiliyor ("A79.5x20 cm") →
  // A7/A5/A4/A3 önekini ayır, yoksa "79.5x20" gibi hayalet ölçü üretir.
  const t = (s || "").replace(",", ".").replace(/\b(A\d)(?=\d)/g, "$1 ");
  const m = t.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/i);
  return m ? `${parseFloat(m[1])}x${parseFloat(m[2])}` : null;
};
/** "1.000 Adet" / "10000Adet" → 1000 / 10000 */
const adetAnahtar = (s) => {
  const m = (s || "").replace(/\./g, "").match(/(\d{2,7})\s*(adet|cilt|yaprak)?/i);
  return m ? Number(m[1]) : null;
};
const setOf = (arr) => new Set(arr.filter(Boolean));
const fark = (a, b) => [...a].filter((x) => !b.has(x));

console.log("=".repeat(76));
console.log("TEDARİKÇİ LİSTESİ ↔ SİTE — EKSİK ANALİZİ");
console.log("=".repeat(76));

const eksikGrup = [], fiyatsiz = [], olcuEksik = [], adetEksik = [], tamam = [];

for (const g of turmat) {
  const slugs = ESLEME[g.grup] ?? [];
  if (!slugs.length) { eksikGrup.push({ grup: g.grup, n: g.varyantlar.length }); continue; }

  const fiyatToplam = slugs.reduce((n, s) => n + (prods.get(s)?.fiyat ?? 0), 0);
  if (fiyatToplam === 0) { fiyatsiz.push({ grup: g.grup, slugs, n: g.varyantlar.length }); continue; }

  const so = slugs.flatMap((s) => opts.get(s) ?? []);
  const siteOlcu = setOf(so.map((o) => olcuAnahtar(`${o.label} ${o.sub}`)));
  const siteAdet = setOf(so.filter((o) => o.grup === "adet").map((o) => adetAnahtar(o.label)));

  const tOlcu = setOf(g.varyantlar.map((v) => olcuAnahtar(v.baglam) ?? olcuAnahtar(v.ozellik)));
  const tAdet = setOf(g.varyantlar.map((v) => adetAnahtar(v.adet)));

  const oEksik = siteOlcu.size ? fark(tOlcu, siteOlcu) : [];
  const aEksik = siteAdet.size ? fark(tAdet, siteAdet) : [];

  if (oEksik.length) olcuEksik.push({ grup: g.grup, slugs, eksik: oEksik, sitede: [...siteOlcu] });
  if (aEksik.length) adetEksik.push({ grup: g.grup, slugs, eksik: aEksik, sitede: [...siteAdet] });
  if (!oEksik.length && !aEksik.length) tamam.push(g.grup);
}

console.log("\n### 1) SİTEDE HİÇ OLMAYAN GRUP");
eksikGrup.length ? eksikGrup.forEach((e) => console.log(`  • ${e.grup} — ${e.n} varyant`)) : console.log("  yok");

console.log("\n### 2) ÜRÜN VAR, FİYAT YOK (sipariş alınamıyor)");
fiyatsiz.length ? fiyatsiz.forEach((f) => console.log(`  • ${f.grup} → ${f.slugs.join(", ")} (tedarikçide ${f.n} varyant)`)) : console.log("  yok");

console.log("\n### 3) EKSİK ÖLÇÜ");
olcuEksik.length ? olcuEksik.forEach((e) => console.log(`  • ${e.grup} (${e.slugs[0]}): eksik ${e.eksik.join(", ")}  |  sitede: ${e.sitede.join(", ") || "-"}`)) : console.log("  yok");

console.log("\n### 4) EKSİK ADET KADEMESİ");
adetEksik.length ? adetEksik.forEach((e) => console.log(`  • ${e.grup} (${e.slugs[0]}): eksik ${e.eksik.join(", ")}  |  sitede: ${e.sitede.join(", ") || "-"}`)) : console.log("  yok");

console.log("\n### 5) ÖLÇÜ+ADET AÇISINDAN TAM OLANLAR");
console.log("  " + (tamam.join(", ") || "-"));
console.log("\n" + "=".repeat(76));

// ── 6) MALZEME/KÂĞIT TÜRÜ KARŞILAŞTIRMASI ───────────────────────────────────
// Yalnız site `paket` seçenekleri ÖLÇÜ değil MALZEME olan gruplar için anlamlı
// (Broşür'de paket=A7/A5 → tür farkı yok, zaten ölçü kıyası yapıldı).
const tok = (s) => new Set((s || "").toLocaleLowerCase("tr")
  .replace(/[^a-z0-9çğıöşü]+/g, " ").split(" ")
  .filter((w) => w.length > 2 && !["gr", "adet", "ile", "ve", "için"].includes(w)));
const ort = (a, b) => { const A = tok(a), B = tok(b); if (!A.size) return 0; let h = 0; for (const t of A) if (B.has(t)) h++; return h / A.size; };

console.log("\n### 6) EKSİK MALZEME/KÂĞIT TÜRÜ");
let turEksikToplam = 0;
for (const g of turmat) {
  const slugs = ESLEME[g.grup] ?? [];
  if (!slugs.length) continue;
  const so = slugs.flatMap((s) => opts.get(s) ?? []);
  const paket = so.filter((o) => o.grup === "paket");
  if (!paket.length) continue;
  // paket seçenekleri ölçü ise (A7 9.5x20) tür kıyası yapma
  const olcuPaket = paket.filter((o) => olcuAnahtar(`${o.label} ${o.sub}`)).length;
  if (olcuPaket >= paket.length * 0.6) continue;

  const metinler = paket.map((o) => `${o.label} ${o.sub}`);
  const eksik = g.varyantlar.filter((v) => !metinler.some((m) => ort(v.ozellik, m) >= 0.55));
  if (!eksik.length) continue;
  turEksikToplam += eksik.length;
  console.log(`\n  ${g.grup} → ${slugs[0]} (${eksik.length}/${g.varyantlar.length} tür sitede yok)`);
  for (const v of eksik) {
    console.log(`     - [${v.kod}] ${Object.values(v.fiyatlar)[0]} TL · ${(v.ozellik || v.baglam).slice(0, 72)}`);
  }
}
if (!turEksikToplam) console.log("  yok");
console.log(`\nTOPLAM EKSİK TÜR: ${turEksikToplam}`);
