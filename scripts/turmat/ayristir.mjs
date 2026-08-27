#!/usr/bin/env node
/**
 * urunlerTurmat.txt (tedarikçi fiyat listesi HTML dökümü) → yapısal ürün/varyant listesi.
 *
 * NEDEN TARAYICI: dosyada tablolar İÇ İÇE (dış tabloda <thead>, satırlar iç tabloda) ve
 * sütun şeması gruptan gruba değişiyor:
 *   A) KOD | FİYAT | ÖZELLİKLER              (kartvizit, broşür…)
 *   B) KOD | ADET | EBAT | AÇIKLAMA | FİYAT  (magnet, bloknot…)
 *   C) KOD | KAPAK | İÇ YAPRAKLAR | 500 Cilt | 1000 Cilt  (makbuz — çok fiyatlı)
 * Regex bu yapıda sessizce yanlış eşleşiyor; gerçek DOM ile satır/hücre ilişkisi kesin.
 *
 * Çıktı: scripts/turmat/turmat-urunler.json  ·  SALT ANALİZ — siteye hiçbir şey yazmaz.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "../../apps/web/node_modules/@playwright/test/index.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const html = fs.readFileSync(path.join(ROOT, "urunlerTurmat.txt"), "utf8");

const browser = await chromium.launch();
const page = await browser.newPage();
await page.setContent(`<!doctype html><html><body>${html}</body></html>`, { waitUntil: "domcontentloaded" });

const data = await page.evaluate(() => {
  const norm = (s) => (s || "").replace(/\s+/g, " ").trim();
  const colKey = (h) => {
    const t = norm(h).toLocaleUpperCase("tr");
    if (!t) return null;
    if (t.includes("KOD")) return "kod";
    if (/\d+\s*C[İI]LT/.test(t)) return "fiyat:" + t.replace(/\s+/g, "");
    if (t.includes("FİYAT") || t.includes("FIYAT")) return "fiyat";
    if (t.includes("ÖZELL") || t.includes("AÇIKLAMA")) return "ozellik";
    if (t.includes("ADET")) return "adet";
    if (t.includes("EBAT") || t.includes("ÖLÇÜ")) return "ebat";
    if (t.includes("KAPAK")) return "kapak";
    if (t.includes("İÇ YAPRAK")) return "icYaprak";
    if (t.includes("SELEFON")) return "selefon";
    return null;
  };
  /** "1750" · "1075.00" · "1.075,00" → 1750 / 1075. Ondalık ayracını KORUR (yoksa 107500 olur). */
  const money = (s) => {
    let t = norm(s).replace(/[^\d.,]/g, "");
    if (!t) return null;
    const dec = t.match(/[.,](\d{1,2})$/);
    if (dec) t = t.slice(0, dec.index).replace(/[.,]/g, "") + "." + dec[1];
    else t = t.replace(/[.,]/g, "");
    const n = Number(t);
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  };

  // Belge sırasında tüm düğümler: ürün başlıkları, başlık satırları, veri satırları, ölçü metinleri
  const all = [...document.querySelectorAll("h4, thead, tr, p, strong, b, h3, h5")];
  const groups = [];
  let cur = null;
  let schema = null;
  let context = null;

  for (const el of all) {
    const text = norm(el.textContent);

    if (el.tagName === "H4") {
      if (!text || /Lütfen Dikkat/i.test(text)) continue;
      if (!cur || cur.grup !== text) {
        cur = { grup: text, varyantlar: [] };
        groups.push(cur);
        schema = null;
        context = null;
      }
      continue;
    }
    if (!cur) continue;

    // Ölçü/adet bağlamı ("Ebat 82x52 mm - 1000 Adet - Çok Renkli", "60 Mikron - 1000 Adet")
    if (["P", "STRONG", "B", "H3", "H5"].includes(el.tagName)) {
      if (text && text.length < 130 && /\d/.test(text) && /(ebat|adet|ölçü|mikron|gr\.|cm|mm|yaprak)/i.test(text)) {
        context = text;
      }
      continue;
    }

    if (el.tagName === "THEAD") {
      const ths = [...el.querySelectorAll("th")].map((t) => colKey(t.textContent));
      if (ths.includes("kod")) schema = ths;
      continue;
    }

    // TR — yalnız DOĞRUDAN çocuk hücreler (iç içe tablo hücreleri karışmasın).
    // Şema DAYATILMAZ: bu dosyada bazı tablolarda <thead> hiç yok (başlık satır içinde),
    // bazılarında 5 sütun var. Bu yüzden hücreler TİPİNE göre tanınır:
    //   • kod    → kısa alfanümerik (NK, 1CA7, 10+MAG2)
    //   • fiyat  → salt rakam (birden çok olabilir: "500 Cilt" / "1000 Cilt")
    //   • adet   → "1000 Adet"
    //   • ebat   → "46x68 mm", "9.5x20 cm"
    //   • özellik→ kalan serbest metin
    if (el.tagName === "TR") {
      if (el.querySelector(":scope > th")) continue;
      const tds = [...el.querySelectorAll(":scope > td")];
      if (tds.length < 2) continue; // iç tabloyu saran colspan hücresi
      // rowspan'lı hücreler SATIRIN VERİSİ DEĞİL, grup etiketidir (EKO/LAK) ya da yan nottur
      // ("Z1 için ilave renk") → kod adayı olamazlar.
      const cellObjs = tds
        .map((d) => ({ text: norm(d.textContent), span: Number(d.getAttribute("rowspan") || 1) }))
        .filter((c) => c.text !== "");
      const cells = cellObjs.map((c) => c.text);
      if (cells.length < 2) continue;

      const isPrice = (c) => /^[\d.,]+$/.test(c) && money(c) !== null;
      const isAdet = (c) => /^\s*\d[\d.]*\s*(adet|cilt|yaprak)/i.test(c);
      const isEbat = (c) => /\d\s*[x×]\s*\d/i.test(c) && c.length <= 30;
      const isKod = (c) => /^[A-Z0-9][A-Z0-9+._-]{0,15}$/i.test(c) && !isPrice(c) && !/^\d+$/.test(c);

      const fiyatCells = cells.filter(isPrice);
      if (!fiyatCells.length) continue;

      // Kod HER ZAMAN fiyattan ÖNCE gelir; rowspan etiketleri ve adet hücreleri aday değildir.
      // Fiyata en yakın aday seçilir (Kartvizit'te [EKO, NK, 220…] → NK, EKO değil).
      const ilkFiyatIdx = cellObjs.findIndex((c) => isPrice(c.text));
      const adaylar = cellObjs.filter((c, i) => i < ilkFiyatIdx && c.span < 2 && !isAdet(c.text));
      let kod = [...adaylar].reverse().find((c) => isKod(c.text))?.text ?? null;
      let adetFromKod = null;
      if (!kod) {
        // Bazı tablolarda kod ve adet AYNI hücrede birleşik ("Z1 1000 Adet") — ayır.
        for (const c of cellObjs.filter((c, i) => i < ilkFiyatIdx && c.span < 2)) {
          const mm = c.text.match(/^([A-Z0-9][A-Z0-9+._-]{0,15})\s+(\d[\d.]*\s*(?:adet|cilt|yaprak).*)$/i);
          if (mm) { kod = mm[1]; adetFromKod = mm[2]; break; }
        }
      }
      if (!kod) continue;

      const kalan = cells.filter((c) => !c.startsWith(kod) && !isPrice(c));
      const adet = adetFromKod ?? kalan.find(isAdet) ?? null;
      const ebat = kalan.find(isEbat) ?? null;
      const ozellik =
        kalan.filter((c) => c !== adet && c !== ebat && c.length > 3).sort((a, b) => b.length - a.length)[0] ?? null;

      // Fiyat etiketleri: thead varsa oradan (500 Cilt / 1000 Cilt), yoksa sırayla.
      const fiyatEtiket = (schema ?? []).filter((k) => k && k.startsWith("fiyat:")).map((k) => k.slice(6));
      const fiyatlar = {};
      fiyatCells.forEach((c, i) => {
        const key = fiyatEtiket[i] ?? (fiyatCells.length === 1 ? "tek" : `fiyat${i + 1}`);
        fiyatlar[key] = money(c);
      });

      cur.varyantlar.push({
        baglam: ebat || context || "(belirtilmemiş)",
        kod,
        adet,
        ozellik,
        fiyatlar,
      });
    }
  }
  return groups;
});

await browser.close();

const outPath = path.join(ROOT, "scripts/turmat/turmat-urunler.json");
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(data, null, 2), "utf8");

const toplam = data.reduce((s, g) => s + g.varyantlar.length, 0);
console.log(`${data.length} grup, ${toplam} varyant → ${outPath}\n`);
for (const g of data) {
  const ctx = [...new Set(g.varyantlar.map((v) => v.baglam))].length;
  console.log(String(g.varyantlar.length).padStart(3) + " varyant · " + String(ctx).padStart(2) + " ölçü/paket  " + g.grup);
}
