#!/usr/bin/env node
/**
 * m² ÜRÜNLERİ: fiyat satırlarına Hasan'ın onaylı satış fiyatını yaz (2026-09-01).
 *
 * KARAR (Hasan): "sistem kâr da koymasın KDV de koymasın, Excel'de girdiğim satış
 * rakamlarına satılsın. Excel'deki satış fiyatı sitemdeki KDV dahil son satış fiyatı
 * olmalı — tüm ürünler için."
 *
 * Kaynak: markala-fiyat-guncel-29.08.26.xlsx → "YAYINLANACAK SATIS FİYATI" kolonu.
 * Kendi rakamımızı ÜRETMEYİZ; Excel ne diyorsa o yazılır.
 *
 * İKİ SORUN BİRDEN ÇÖZÜLÜR:
 *  1) 13 üründe 61 satır hiç uygulanmamıştı (eski maliyet değerinde kalmış).
 *  2) Bölerek oluşturduğumuz 11 ürün (5 branda + 6 folyo) Excel'de SLUG olarak yok →
 *     toplu güncelleme onlara hiç ulaşamıyor. optionKey üzerinden ebeveynden eşlenir.
 *
 * GERÇEK MALİYET KAYBOLMASIN: Excel'in MALİYET kolonu ürünün content.maliyetUsd alanına
 * yazılır. Fiyat motoru content'i okumaz (sıfır risk); kâr raporlaması ileride buradan besleyecek
 * (bkz. costing.ts'teki not).
 *
 * SIRA UYARISI: Bu script fiyat motoru düzeltmesinden (pricing.ts, marj/KDV eklemenin
 * kaldırılması) ÖNCE çalıştırılırsa fiyatlar geçici olarak %44 YÜKSEK görünür — asla düşük
 * değil. Ters sırada çalıştırma.
 *
 * Kullanım: ADMIN_EMAIL=... ADMIN_PASSWORD=... node scripts/katalog/m2-satis-fiyati-uygula.mjs [--dry]
 */

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const API = process.env.API_URL || "https://api.markala.com.tr";
const DRY = process.argv.includes("--dry");
const XLS = process.env.FIYAT_XLSX || "C:/Users/Administrator/Downloads/markala-fiyat-guncel-29.08.26.xlsx";
const KUR = 49;

/** Eski birleşik ürün → bölünmüş çocuk ürünler (Excel bunları slug olarak tanımıyor). */
const COCUK = {
  "vinil-branda-440gr": ["cin-vinil-branda", "avrupa-vinil-branda", "blockout-arkasi-siyah-branda",
                          "isikli-backlit-branda", "reflektif-vinil-branda"],
  "folyo-cesitleri": ["kesim-folyo", "kumlama-buzlu-cam-folyosu", "seffaf-folyo",
                       "laminasyonlu-folyo", "reflektif-folyo", "lumen-folyo"],
};

// --- Excel oku ---
let XLSX;
try {
  XLSX = require("xlsx");
} catch {
  // Tek seferlik ops scripti. xlsx BİLEREK package.json'a EKLENMEDİ: repo pnpm kullanıyor,
  // package.json'a npm ile bağımlılık eklemek pnpm-lock.yaml ile uyumsuzluk yaratır ve
  // deploy'daki `--frozen-lockfile` kurulumunu kırar (2026-09-01'de bu hataya düşüldü).
  console.error("`xlsx` paketi yok. Geçici kur: pnpm add -w -D xlsx  (iş bitince geri al).");
  process.exit(1);
}
if (!fs.existsSync(XLS)) { console.error(`Excel bulunamadı: ${XLS}`); process.exit(1); }
const wb = XLSX.readFile(XLS);
const rows = XLSX.utils.sheet_to_json(wb.Sheets["FİYATLAR"], { header: 1, blankrows: false });
const basliklar = rows[0].map((h) => String(h ?? "").trim());
const K = (ad) => {
  const i = basliklar.indexOf(ad);
  if (i < 0) { console.error(`Excel kolonu yok: ${ad}`); process.exit(1); }
  return i;
};
const cTip = K("FİYAT TİPİ"), cPara = K("PARA"), cMal = K("MALİYET"), cYeni = K("YAYINLANACAK SATIS FİYATI");
const cSlug = K("SLUG"), cGrup = K("GRUP-K"), cSec = K("SEÇENEK-K"), cKad = K("KADEME-K");

/** (slug, groupKey, optionKey, dimKey) → { satis, maliyet } — yalnız m² satırları */
const hedef = new Map();
for (const r of rows.slice(1)) {
  if (String(r[cTip] ?? "").trim() !== "m²") continue;
  const slug = r[cSlug], gkey = r[cGrup];
  const yeni = Number(r[cYeni]);
  if (!slug || !gkey || !Number.isFinite(yeni)) continue;
  const okey = String(r[cSec] ?? "");
  const dim = r[cKad] == null ? "" : String(r[cKad]);
  // DTO kısıtı: cost en fazla 2 ondalık. Excel formülünden gelen kuyruklar
  // (15.839999999999998 → 15.84) ve 4 ondalıklı saten bayrak değerleri (6.8952 → 6.90)
  // yuvarlanır; sapma ≤0,25 ₺/m² (%0,06).
  hedef.set(`${slug}|${gkey}|${okey}|${dim}`, {
    satis: Math.round(yeni * 100) / 100,
    maliyet: Number.isFinite(Number(r[cMal])) ? Number(r[cMal]) : null,
    para: String(r[cPara] ?? "USD").trim(),
    okey,
  });
}
console.log(`Excel: ${hedef.size} adet m² fiyat satırı okundu\n`);

// --- Giriş ---
async function girisYap() {
  const { ADMIN_EMAIL: email, ADMIN_PASSWORD: password } = process.env;
  if (!email || !password) { console.error("ADMIN_EMAIL + ADMIN_PASSWORD gerekli."); process.exit(1); }
  const r = await fetch(`${API}/api/auth/login`, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ email, password }) });
  if (!r.ok) { console.error(`Giriş başarısız: ${r.status}`); process.exit(1); }
  return (await r.json()).accessToken;
}
const token = await girisYap();
const H = { "content-type": "application/json", authorization: `Bearer ${token}` };
const getUrun = (s) => fetch(`${API}/api/products/${s}`).then((r) => (r.ok ? r.json() : null)).catch(() => null);

// İşlenecek ürünler: Excel'deki m² slug'ları + bölünmüş çocuklar
const excelSluglar = [...new Set([...hedef.keys()].map((k) => k.split("|")[0]))];
const tumSluglar = [...new Set([...excelSluglar, ...Object.values(COCUK).flat()])];

const yedek = [];
let yazilan = 0, degismeyen = 0, eslesmeyen = 0, hataliUrun = 0;

for (const slug of tumSluglar) {
  const u = await getUrun(slug);
  if (!u?.id) { console.error(`✗ ürün okunamadı: ${slug}`); hataliUrun++; continue; }
  if (u.pricingMode !== "area") { continue; } // yalnız m² ürünleri
  const ebeveyn = Object.entries(COCUK).find(([, v]) => v.includes(slug))?.[0] ?? slug;

  const mevcut = u.prices ?? [];
  const yeniSet = [];
  const maliyetUsd = {};
  const degisim = [];
  for (const p of mevcut) {
    const gkey = p.groupKey ?? "", okey = p.optionKey ?? "", dim = p.dimKey ?? "";
    const h = hedef.get(`${ebeveyn}|${gkey}|${okey}|${dim}`);
    const eski = p.cost == null ? null : Number(p.cost);
    let cost = eski;
    if (h) {
      cost = h.satis;
      if (h.maliyet != null && okey) maliyetUsd[okey] = h.maliyet;
      if (eski == null || Math.abs(eski - h.satis) > 1e-9) {
        degisim.push({ okey: okey || gkey, dim, eski, yeni: h.satis, para: h.para });
      } else degismeyen++;
    } else if (okey) eslesmeyen++;
    yeniSet.push({
      ...(p.groupKey ? { groupKey: p.groupKey } : {}),
      ...(p.optionKey ? { optionKey: p.optionKey } : {}),
      ...(p.dimKey ? { dimKey: p.dimKey } : {}),
      ...(cost != null ? { cost } : {}),
      price: Number(p.price ?? 0),
    });
  }

  if (!degisim.length) { continue; }
  console.log(`■ ${slug}${ebeveyn !== slug ? `  (Excel'de "${ebeveyn}" olarak)` : ""}`);
  for (const d of degisim) {
    const s = (d.eski ?? 0) * KUR * 1.2 * 1.2, y = d.yeni * KUR;
    console.log(`    ${String(d.okey + (d.dim ? "/" + d.dim : "")).padEnd(26)} ${String(d.eski).padStart(7)} → ${String(d.yeni).padStart(7)} ${d.para}   (${s.toFixed(2)} → ${y.toFixed(2)} ₺/m²)`);
  }
  yedek.push({ slug, id: u.id, oncekiPrices: mevcut.map((p) => ({ groupKey: p.groupKey, optionKey: p.optionKey, dimKey: p.dimKey, cost: p.cost, price: p.price })), oncekiContent: u.content ?? null });

  if (DRY) { yazilan += degisim.length; continue; }

  const pr = await fetch(`${API}/api/products/${u.id}/prices`, { method: "PUT", headers: H, body: JSON.stringify({ prices: yeniSet }) });
  if (!pr.ok) { console.error(`  ✗ fiyat yazılamadı: ${pr.status} ${(await pr.text()).slice(0, 160)}`); hataliUrun++; continue; }
  if (Object.keys(maliyetUsd).length) {
    await fetch(`${API}/api/products/${u.id}`, { method: "PATCH", headers: H, body: JSON.stringify({ content: { ...(u.content ?? {}), maliyetUsd } }) });
  }
  // Doğrulama
  const k = await getUrun(slug);
  const bozuk = degisim.filter((d) => {
    const e = (k?.prices ?? []).find((x) => (x.optionKey ?? "") === (d.okey ?? "") && (x.dimKey ?? "") === d.dim);
    return !e || Math.abs(Number(e.cost ?? NaN) - d.yeni) > 1e-9;
  });
  if (bozuk.length || (k?.prices ?? []).length !== yeniSet.length) {
    console.error(`  ✗ DOĞRULAMA BAŞARISIZ — ${bozuk.length} satır tutmadı, satır ${k?.prices?.length}/${yeniSet.length}`);
    hataliUrun++; continue;
  }
  console.log(`  ✓ ${degisim.length} satır yazıldı ve doğrulandı · başlangıç ${k.displayPrice} ₺/m²\n`);
  yazilan += degisim.length;
}

if (!DRY && yedek.length) {
  const p = path.join("docs", `fiyat-geri-alma-${new Date(Date.now()).toISOString().slice(0, 10)}.json`);
  fs.mkdirSync("docs", { recursive: true });
  fs.writeFileSync(p, JSON.stringify(yedek, null, 2), "utf8");
  console.log(`Geri alma dosyası: ${p}`);
}
console.log(`\nÖzet — ${DRY ? "[DRY] yazılacak" : "yazılan"}: ${yazilan} satır · zaten doğru: ${degismeyen} · Excel'de karşılığı yok: ${eslesmeyen} · hatalı ürün: ${hataliUrun}`);
if (hataliUrun) process.exit(1);
