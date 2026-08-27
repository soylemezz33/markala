#!/usr/bin/env node
/**
 * MALİYET KIYASI — tedarikçi listesindeki fiyatlar ÜRÜN MALİYETİDİR (satış fiyatı değil).
 * Sitedeki product_prices.cost ile birebir tutmalı. Farkları raporlar. SALT ANALİZ.
 *
 * Eşleme: tedarikçi varyantı (ölçü + adet [+ tür]) → site fiyat satırı (option_key + dim_key).
 * Ölçü ve adet sayısal olarak normalize edilir; tür eşlemesi kelime örtüşmesiyle yapılır ve
 * emin olunamayan satırlar "eşleşmedi" olarak AYRI raporlanır (yanlış kıyas üretmemek için).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const DIR = path.dirname(fileURLToPath(import.meta.url));
const turmat = JSON.parse(fs.readFileSync(path.join(DIR, "turmat-urunler.json"), "utf8"));

const ESLEME = {
  "Kartvizit": "klasik-kartvizit", "Broşür": "brosur", "Pro Broşür": "pro-brosur",
  "Selefonlu Broşür": "selefonlu-brosur", "El ilanı": "el-ilani", "Afişler": "afis-105gr",
  "Antetli": "antetli-kagit", "Magnet": "magnet-promosyon", "Amerikan Servis": "amerikan-servis",
  "KAPI ASKI BROŞÜRLERİ": "kapi-aski-brosur", "Dosyalar": "cepli-dosya", "Etiket": "etiket",
  "Makbuz": "makbuz", "Oto Paspas": "oto-paspas", "Küp Bloknot": "kup-bloknot",
  "Spiralli Bloknot": "spiralli-bloknot", "Kapaklı Bloknot": "kapakli-bloknot",
  "Kapaksız Bloknot": "kapaksiz-bloknot", "NOTLUK": "notluk", "ÇANTALAR": "canta",
};

const optLabel = new Map(); // slug|option_key → "label sub"
for (const l of fs.readFileSync(path.join(DIR, "site-secenekler.txt"), "utf8").split("\n")) {
  const [slug, grup, label, sub] = l.trim().split("|");
  if (!slug || !label) continue;
  optLabel.set(`${slug}|${(label || "").toLocaleLowerCase("tr")}`, `${label} ${sub ?? ""}`);
  optLabel.set(`${slug}|LBL|${label}`, `${label} ${sub ?? ""}`);
}

const rows = []; // {slug, optKey, dim, cost, price}
for (const l of fs.readFileSync(path.join(DIR, "site-fiyatlar.txt"), "utf8").split("\n").filter(Boolean)) {
  const [slug, , optKey, dim, cost, price] = l.trim().split("|");
  rows.push({ slug, optKey, dim, cost: Number(cost), price: Number(price) });
}

const dims = (s) => {
  const t = (s || "").replace(",", ".").replace(/\b(A\d)(?=\d)/g, "$1 ");
  const m = t.match(/(\d+(?:\.\d+)?)\s*[x×]\s*(\d+(?:\.\d+)?)/i);
  return m ? `${parseFloat(m[1])}x${parseFloat(m[2])}` : null;
};
const qty = (s) => {
  const m = (s || "").replace(/\./g, "").match(/(\d{2,7})/);
  return m ? Number(m[1]) : null;
};
/** Metinde "1000 Adet" kalıbını arar — "Ebat 82x52 mm - 1000 Adet" gibi başlıklarda
 *  ölçüyü adet sanmamak için sayının ardından ADET/CİLT gelmesi ŞARTI aranır. */
const qtyEtiketli = (s) => {
  const m = (s || "").replace(/\./g, "").match(/(\d{2,7})\s*(?:adet|cilt|yaprak)/i);
  return m ? Number(m[1]) : null;
};
const tok = (s) => new Set((s || "").toLocaleLowerCase("tr").replace(/[^a-z0-9çğıöşü]+/g, " ")
  .split(" ").filter((w) => w.length > 2 && !["gr", "adet", "yön", "renkli"].includes(w)));
const ort = (a, b) => { const A = tok(a), B = tok(b); if (!A.size) return 0; let h = 0; for (const t of A) if (B.has(t)) h++; return h / A.size; };

/** option_key → o seçeneğin insan-okur etiketi (ölçü/tür eşlemesi için). */
function labelFor(slug, optKey) {
  for (const [k, v] of optLabel) {
    if (!k.startsWith(slug + "|")) continue;
    const key = k.slice(slug.length + 1);
    if (key.toLocaleLowerCase("tr").replace(/[^a-z0-9çğıöşü]/g, "") === (optKey || "").toLocaleLowerCase("tr").replace(/[^a-z0-9çğıöşü]/g, "")) return v;
  }
  // a7/a5 gibi kısaltmalar: etiketi doğrudan içeren seçenek
  for (const [k, v] of optLabel) {
    if (k.startsWith(slug + "|LBL|") && v.toLocaleLowerCase("tr").startsWith((optKey || "").toLocaleLowerCase("tr"))) return v;
  }
  return optKey;
}

const farkli = [], ayni = [], eslesmeyen = [];

for (const g of turmat) {
  const slug = ESLEME[g.grup];
  if (!slug) continue;
  const pr = rows.filter((r) => r.slug === slug);
  if (!pr.length) continue;

  for (const v of g.varyantlar) {
    const vMaliyet = Object.values(v.fiyatlar)[0];
    const vDim = dims(v.baglam) ?? dims(v.ozellik);
    // Adet satırda yoksa bölüm başlığından al (kartvizit: "Ebat 82x52 mm - 1000 Adet").
    const vQty = qtyEtiketli(v.adet) ?? qty(v.adet) ?? qtyEtiketli(v.baglam);

    // 0) EN GÜVENİLİR: site option_key'i tedarikçi KODUNUN aynısı olabilir
    // (kartvizit: mna/cyp/cym… → site bu listeden kurulmuş). Kod eşleşiyorsa tartışma biter.
    const kodNorm = (s) => (s || "").toLocaleLowerCase("tr").replace(/[^a-z0-9]/g, "");
    const kodEsit = pr.filter((r) => kodNorm(r.optKey) === kodNorm(v.kod));
    if (kodEsit.length) {
      // Adet kademesi belirsizse TAHMİN ETME — yanlış kademeyle kıyaslamak uydurma fark üretir
      // (çanta: tedarikçi 500'lük fiyat veriyor, site 500/1000/2000 tutuyor).
      // Tedarikçi satırında adet YOKSA ve sitede birden çok kademe varsa hangisine ait
      // olduğu bilinemez → tahmin etme, elle kontrole bırak.
      const kademeler = new Set(kodEsit.map((r) => r.dim));
      if (!vQty && kademeler.size > 1) {
        eslesmeyen.push({ grup: g.grup, kod: v.kod, maliyet: vMaliyet, aciklama: `adet kademesi belirsiz — sitede ${[...kademeler].join("/")}` });
        continue;
      }
      const hedef = kodEsit.find((r) => qty(r.dim) === (vQty ?? qty([...kademeler][0])));
      if (!hedef) {
        eslesmeyen.push({ grup: g.grup, kod: v.kod, maliyet: vMaliyet, aciklama: `adet kademesi belirsiz — sitede ${kodEsit.map((r) => r.dim).join("/")}` });
        continue;
      }
      const kayit = { grup: g.grup, slug, kod: v.kod, listede: vMaliyet, sitede: hedef.cost, satis: hedef.price, nerede: `${hedef.optKey} / ${hedef.dim}`, kodEslesti: true };
      (Math.abs(hedef.cost - vMaliyet) < 0.5 ? ayni : farkli).push(kayit);
      continue;
    }

    // 1) ölçü + adet ile eşleşme (matris ürünler)
    let aday = pr.filter((r) => {
      const lbl = labelFor(slug, r.optKey);
      const okDim = vDim ? dims(lbl) === vDim : true;
      const okQty = vQty ? qty(r.dim) === vQty : true;
      return okDim && okQty && (vDim || vQty);
    });
    // 2) tür ile eşleşme (kartvizit gibi malzeme bazlı)
    if (aday.length !== 1) {
      const t = pr
        .map((r) => ({ r, s: ort(v.ozellik, labelFor(slug, r.optKey)) }))
        .filter((x) => x.s >= 0.6 && (!vQty || qty(x.r.dim) === vQty))
        .sort((a, b) => b.s - a.s);
      if (t.length) aday = [t[0].r];
    }
    if (aday.length !== 1) { eslesmeyen.push({ grup: g.grup, kod: v.kod, maliyet: vMaliyet, aciklama: v.ozellik ?? v.baglam }); continue; }

    const r = aday[0];
    const kayit = { grup: g.grup, slug, kod: v.kod, listede: vMaliyet, sitede: r.cost, satis: r.price, nerede: `${r.optKey} / ${r.dim}` };
    if (Math.abs(r.cost - vMaliyet) < 0.5) ayni.push(kayit);
    else farkli.push(kayit);
  }
}

console.log("=".repeat(84));
console.log("MALİYET KIYASI — tedarikçi listesi ↔ sitedeki maliyet (product_prices.cost)");
console.log("=".repeat(84));
console.log(`\nAynı: ${ayni.length}  ·  FARKLI: ${farkli.length}  ·  eşleşmeyen (elle bakılmalı): ${eslesmeyen.length}\n`);

const byGrup = {};
for (const f of farkli) (byGrup[f.grup] ??= []).push(f);
for (const [grup, list] of Object.entries(byGrup)) {
  console.log(`\n${grup}  (${list.length} satır farklı)`);
  for (const f of list.sort((a, b) => b.listede - b.sitede - (a.listede - a.sitede))) {
    const fark = f.listede - f.sitede;
    const yon = fark > 0 ? "site DÜŞÜK" : "site YÜKSEK";
    console.log(`   [${f.kod}] ${f.nerede.padEnd(22)} listede ${String(f.listede).padStart(6)} TL · sitede ${String(f.sitede).padStart(7)} TL  → ${yon} (${fark > 0 ? "+" : ""}${fark})`);
  }
}

if (eslesmeyen.length) {
  console.log(`\n\nEŞLEŞMEYEN (${eslesmeyen.length}) — sitede karşılığı bulunamadı, elle kontrol:`);
  for (const e of eslesmeyen.slice(0, 30)) console.log(`   ${e.grup} [${e.kod}] ${e.maliyet} TL · ${(e.aciklama || "").slice(0, 58)}`);
  if (eslesmeyen.length > 30) console.log(`   … +${eslesmeyen.length - 30}`);
}

// ── SQL ÜRETİMİ (yalnız GÜVENLİ eşleşmeler) ─────────────────────────────────
// Magnet "10+" satırları 1000 adet BAŞINA fiyattır (toplam değil) → otomatik güncellenmez.
// Güvensiz sayılanlar (otomatik güncellenMEZ, elle bakılır):
//  • "10+" → 1000 adet BAŞINA fiyat, toplam değil
//  • kodu ölçü olan satırlar ("25x37x8") → gerçek kod değil, eşleşme şüpheli
//  • tür adı eşleşmeyenler (MAG1 "özel kesim" iken site satırı "oval") → yanlış hedef riski
const supheliKod = (k) => /^10\+/.test(k) || /^\d+(\.\d+)?x\d/i.test(k);
// Kod BİREBİR eşleştiyse tür metnini sorgulama — en güçlü sinyal odur (site bu listeden kurulmuş).
const turUyusmaz = (f) => {
  if (f.kodEslesti) return false;
  const v = turmat.find((g) => g.grup === f.grup)?.varyantlar.find((x) => x.kod === f.kod);
  const lbl = labelFor(f.slug, f.nerede.split(" / ")[0]);
  return v?.ozellik ? ort(v.ozellik, lbl) < 0.34 : false;
};
const guvenli = farkli.filter((f) => !supheliKod(f.kod) && !turUyusmaz(f));
const atlanan = farkli.filter((f) => supheliKod(f.kod) || turUyusmaz(f));
const sql = guvenli.map((f) =>
  `UPDATE product_prices pr SET cost = ${f.listede}, updated_at = now() FROM products p ` +
  `WHERE pr.product_id = p.id AND p.slug = '${f.slug}' AND coalesce(pr.option_key,'') = '${f.nerede.split(" / ")[0]}' ` +
  `AND coalesce(pr.dim_key,'') = '${f.nerede.split(" / ")[1]}';  -- ${f.grup} [${f.kod}] ${f.sitede} -> ${f.listede}`,
);
fs.writeFileSync(path.join(DIR, "maliyet-duzelt.sql"),
  "-- Tedarikçi listesine göre MALİYET düzeltmesi (2026-08-27). Yalnız cost sütunu; satış fiyatına DOKUNULMAZ.\nBEGIN;\n" +
  sql.join("\n") + "\nCOMMIT;\n" +
  "\n-- Kontrol\nSELECT p.slug, pr.option_key, pr.dim_key, pr.cost FROM product_prices pr JOIN products p ON pr.product_id=p.id WHERE p.slug IN ('" +
  [...new Set(guvenli.map((f) => f.slug))].join("','") + "') ORDER BY p.slug, pr.option_key, pr.dim_key;\n", "utf8");
console.log(`\n\nSQL üretildi: ${guvenli.length} satır → scripts/turmat/maliyet-duzelt.sql`);
if (atlanan.length) console.log(`Otomatik güncellenMEyen (birim fiyat mantığı): ${atlanan.map((a) => a.kod).join(", ")}`);
