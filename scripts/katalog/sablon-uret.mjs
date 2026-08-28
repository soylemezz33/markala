/**
 * FİYAT GİRİŞ ŞABLONU ÜRETİCİ (2026-08-28, Hasan talebi).
 *
 * Hasan'ın "dijital baskı kategorisi (1).xlsx" dosyasındaki 61 ürünü okur ve siteye
 * DOĞRUDAN import edilebilecek düz bir fiyat tablosu üretir. Hasan yalnız MALİYET
 * (ve isterse SATIŞ) sütununu doldurur; geri kalan her şey önceden yazılıdır.
 *
 * ÜÇ FİYAT TİPİ VAR — çünkü sitedeki motor (apps/api/src/orders/pricing.ts) üç türlü
 * hesaplıyor. Yanlış tipte satır girilirse fiyat yanlış çıkar:
 *
 *  matris    → her (seçenek × adet) çifti için AYRI fiyat. Adet indirimi UYGULANMAZ,
 *              çünkü kademe fiyatı zaten elle girilmiştir. (Kartvizit, broşür, zarf…)
 *  toplamali → yalnız BİRİM fiyat girilir; seçili priced grupların fiyatları TOPLANIR,
 *              sonra adede göre çarpılır ve hacim indirimi OTOMATİK uygulanır
 *              (10 adet %8 … 250 adet %35). Adet başına satır GİRİLMEZ.
 *  m2        → 1 m² fiyatı girilir. Kenar işlemleri (dikiş/kopça) çevre metresi,
 *              aksesuarlar (direk/duba) adet başına ayrı satırdır.
 */
import ExcelJS from "exceljs";
import { readFileSync } from "node:fs";

const KAYNAK = process.argv[2] ?? "C:/Users/Administrator/Downloads/dijital baskı kategorisi (1).xlsx";
const HEDEF = process.argv[3] ?? "C:/Users/Administrator/Downloads/markala-fiyat-girisi.xlsx";

// Adet kademeleri — ürün ailesine göre. Hasan satır ekleyip çıkarabilir.
const KADEME = {
  kartvizit: [1000, 2000, 3000, 5000, 10000],
  matbaa: [1000, 2000, 5000, 10000],
  canta: [500, 1000, 2000],
  bloknot: [100, 250, 500, 1000],
};

/** urun adı → {tip, kademe} eşlemesi. Burada olmayan m2 sayılır. */
const TIP = {
  // ── m² (alan hesaplı) ───────────────────────────────────────────────
  "Avrupa Vinil Baskı": ["m2"], "Çin (Lamine) Vinil Baskı": ["m2"],
  "Mesh Delikli Vinil Baskı": ["m2"], "One Way Vision Baskı": ["m2"],
  "Folyo Baskı": ["m2"], "Baskes Folyo": ["m2"], "Duvar Kağıdı": ["m2"],
  "Dekota\\Foreks Baskı": ["m2"], "Pleksi Baskı": ["m2"], "Kompozit Baskı": ["m2"],
  "Kanvas Tablo Baskı": ["m2"], "UV DTF Baskı": ["m2"],
  // ── matris (seçenek × adet) ─────────────────────────────────────────
  "Sticker Baskı": ["matris", "matbaa"], "Amerikan Servis": ["matris", "matbaa"],
  "Islak Mendil": ["matris", "matbaa"], "Baskılı Stick Şeker": ["matris", "matbaa"],
  "Baskılı Sachet Tuz": ["matris", "matbaa"], "Bardak Altlığı": ["matris", "matbaa"],
  "Masa Kartı - Tent Card": ["matris", "matbaa"], "Adisyon Fişi": ["matris", "matbaa"],
  "Spiralli Bloknot/Defter": ["matris", "bloknot"], "Masa Takvimi": ["matris", "bloknot"],
  "Küp Bloknot": ["matris", "bloknot"],
  "Amerikan Bristol Karton Çanta": ["matris", "canta"], "Kraft Karton Çanta": ["matris", "canta"],
  "Kağıt Oto Paspas": ["matris", "matbaa"], "Antetli Kağıt": ["matris", "matbaa"],
  "Diplomat Zarf": ["matris", "matbaa"], "Cepli Dosya": ["matris", "matbaa"],
  "Makbuz": ["matris", "matbaa"], "El İlanı": ["matris", "matbaa"],
  "Kapı Askısı El İlanı": ["matris", "matbaa"], "Broşür": ["matris", "matbaa"],
  "Standart Kartvizit": ["matris", "kartvizit"], "Sıvama Kartvizit": ["matris", "kartvizit"],
  "Kabartma Laklı Kartvizit": ["matris", "kartvizit"], "Şeffaf Kartvizit": ["matris", "kartvizit"],
};
// Geri kalan her şey toplamalı (stand, tabela, bayrak, promosyon, plaket, kaşe…)

const kaynak = new ExcelJS.Workbook();
await kaynak.xlsx.readFile(KAYNAK);

const satirlar = [];
for (const ws of kaynak.worksheets) {
  let urun = null, gruplar = null;
  ws.eachRow((row) => {
    const c = [];
    row.eachCell({ includeEmpty: true }, (cell) => c.push(String(cell.value ?? "").trim()));
    while (c.length && !c[c.length - 1]) c.pop();
    if (!c.length || !c[0]) return;
    if (c.length === 1) { urun = c[0]; gruplar = []; return; }   // yalnız ilk hücre dolu → ürün başlığı
    if (urun) gruplar.push({ ad: c[0], secenekler: c.slice(1).filter(Boolean) });
    if (urun) satirlar.push({ sayfa: ws.name, urun, grup: gruplar[gruplar.length - 1] });
  });
}

// Ürün bazında topla
const urunler = new Map();
for (const s of satirlar) {
  const k = s.sayfa + "||" + s.urun;
  if (!urunler.has(k)) urunler.set(k, { sayfa: s.sayfa, urun: s.urun, gruplar: [] });
  const u = urunler.get(k);
  if (s.grup && !u.gruplar.some((g) => g.ad === s.grup.ad)) u.gruplar.push(s.grup);
}

const cikti = [];
for (const u of urunler.values()) {
  const [tip, kademeAd] = TIP[u.urun] ?? ["toplamali"];
  const kademeler = kademeAd ? KADEME[kademeAd] : null;
  // Tek seçenekli gruplar (ör. "Baskı Yönü: Tek Yön") fiyat taşımaz — sabit özelliktir.
  const fiyatliGruplar = u.gruplar.filter((g) => g.secenekler.length > 1);
  const sabitler = u.gruplar.filter((g) => g.secenekler.length === 1)
    .map((g) => `${g.ad}: ${g.secenekler[0]}`).join(" · ");

  if (!fiyatliGruplar.length) {
    cikti.push({ ...ortak(u, tip), grup: "—", secenek: "(tek varyant)", adet: tip === "m2" ? "1 m²" : (kademeler ? kademeler[0] : "1 adet"), sabit: sabitler });
    continue;
  }
  for (const g of fiyatliGruplar) {
    for (const s of g.secenekler) {
      if (tip === "matris" && kademeler) {
        for (const a of kademeler) cikti.push({ ...ortak(u, tip), grup: g.ad, secenek: s, adet: `${a} adet`, sabit: sabitler });
      } else {
        cikti.push({ ...ortak(u, tip), grup: g.ad, secenek: s, adet: tip === "m2" ? "1 m²" : "1 adet (birim)", sabit: sabitler });
      }
    }
  }
}
function ortak(u, tip) { return { sayfa: u.sayfa, urun: u.urun, tip }; }

// ── Çıktı dosyası ──────────────────────────────────────────────────────
const wb = new ExcelJS.Workbook();
wb.creator = "Markala";

const k = wb.addWorksheet("KILAVUZ");
k.columns = [{ width: 18 }, { width: 110 }];
const kilavuz = [
  ["", ""],
  ["FİYAT TİPİ", "NE GİRECEKSİN"],
  ["matris", "Her (seçenek × adet) satırına O ADEDİN TOPLAM fiyatını yaz. Örn. 1000 adet kartvizit = 350 TL, 2000 adet = 700 TL. Adet indirimi UYGULANMAZ, çünkü kademeyi zaten sen belirledin."],
  ["toplamali", "Yalnız BİRİM fiyat yaz (1 adetlik). Seçili grupların fiyatları toplanır. Adet indirimi OTOMATİKTİR: 10 adette %8, 25'te %15, 50'de %22, 100'de %28, 250'de %35. Adet başına satır YAZMA."],
  ["m2", "1 metrekarenin fiyatını yaz. Dikiş/kopça gibi kenar işlemleri metretül (çevre) üzerinden, direk/duba gibi aksesuarlar adet başına ayrı satırdır — BİRİM sütununda belirtilmiştir."],
  ["", ""],
  ["SÜTUNLAR", ""],
  ["MALİYET", "ZORUNLU. Sana mal oluş bedeli, KDV HARİÇ. Kâr raporu bu sütundan hesaplanır — boş bırakılırsa o satır kârsız görünür."],
  ["SATIŞ", "İsteğe bağlı. Boş bırakırsan kategori kâr marjından otomatik hesaplanır (kartvizit 1.65 · broşür 1.70 · ambalaj 1.80). Elle yazarsan yazdığın geçerli olur."],
  ["", ""],
  ["KURALLAR", ""],
  ["1", "Satır silme, satır EKLE. Bir adet kademesi sende yoksa MALİYET'i boş bırak — o kombinasyon sitede hiç gösterilmez, yanlış fiyatla görünmez."],
  ["2", "Adet kademelerini değiştirebilirsin. Satırı kopyalayıp ADET'i düzenlemen yeterli."],
  ["3", "Sadece rakam yaz. 'TL', nokta, virgül, boşluk koyma. 1250 yaz, 1.250 TL yazma."],
  ["4", "Tek seçenekli gruplar (ör. 'Baskı Yönü: Tek Yön') fiyat satırı almaz; SABİT ÖZELLİKLER sütununda ürün açıklaması olarak durur."],
  ["5", "Ürün veya seçenek eklemek istersen en alta yaz — SAYFA / ÜRÜN / FİYAT TİPİ sütunlarını doldurman yeterli."],
];
kilavuz.forEach((r) => k.addRow(r));
k.getRow(2).font = { bold: true }; k.getRow(7).font = { bold: true }; k.getRow(11).font = { bold: true };
k.getColumn(2).alignment = { wrapText: true, vertical: "top" };
k.getColumn(1).font = { bold: true };

const ws = wb.addWorksheet("FİYAT GİRİŞİ");
ws.columns = [
  { header: "SAYFA", key: "sayfa", width: 22 },
  { header: "ÜRÜN", key: "urun", width: 30 },
  { header: "FİYAT TİPİ", key: "tip", width: 11 },
  { header: "SEÇENEK GRUBU", key: "grup", width: 24 },
  { header: "SEÇENEK", key: "secenek", width: 46 },
  { header: "BİRİM / ADET", key: "adet", width: 15 },
  { header: "MALİYET", key: "maliyet", width: 12 },
  { header: "SATIŞ", key: "satis", width: 12 },
  { header: "SABİT ÖZELLİKLER", key: "sabit", width: 52 },
];
cikti.forEach((r) => ws.addRow(r));

const RENK = { m2: "FFE8E3F5", matris: "FFE3EFE8", toplamali: "FFF7EEDD" };
ws.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
ws.getRow(1).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4B3AA0" } };
ws.views = [{ state: "frozen", ySplit: 1 }];
ws.autoFilter = "A1:I1";
ws.eachRow((row, i) => {
  if (i === 1) return;
  const tip = row.getCell(3).value;
  if (RENK[tip]) row.getCell(3).fill = { type: "pattern", pattern: "solid", fgColor: { argb: RENK[tip] } };
  for (const c of [7, 8]) {
    row.getCell(c).numFmt = "#,##0";
    row.getCell(c).fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF9E0" } };
    row.getCell(c).border = { left: { style: "thin" }, right: { style: "thin" }, top: { style: "hair" }, bottom: { style: "hair" } };
  }
  row.getCell(9).font = { size: 9, color: { argb: "FF777777" } };
});

await wb.xlsx.writeFile(HEDEF);
const say = cikti.reduce((a, r) => ((a[r.tip] = (a[r.tip] ?? 0) + 1), a), {});
console.log(`${cikti.length} fiyat satiri → ${HEDEF}`);
console.log("  tip dagilimi:", JSON.stringify(say));
console.log("  urun sayisi:", urunler.size);
