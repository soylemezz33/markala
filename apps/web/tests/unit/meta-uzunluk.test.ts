import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * SERP bütçesi bekçisi (2026-08-31).
 *
 * Kural kodda zaten yazılıydı ("SERP bütçesi: title ≤60 kr, description ≤160 kr",
 * 2026-08-01 SEO denetimi) ama hiçbir yerde ZORLANMIYORDU: 31 Ağustos taramasında
 * gezilen 59 sayfanın 29'unda başlık 60 karakteri, 14'ünde açıklama 160 karakteri
 * aşıyordu. Google fazlasını kestiği için yazılan metnin sonu kullanıcıya hiç görünmez.
 *
 * Bu test bir CIRCIR (ratchet): mevcut ihlaller BILINEN_UZUN listesinde muaf — onları
 * tek tek elden geçireceğiz. YENİ ihlal eklenemez. Bir sayfa düzeltildiğinde listeden
 * çıkarılır; liste küçüldükçe borç kapanır, asla büyümez.
 *
 * KAPSAM SINIRI: test KAYNAK KODU okur, yalnız statik `export const metadata` bloklarını
 * görebilir. `generateMetadata` ile ÇALIŞMA ANINDA üretilen başlıklar (ürün, kategori,
 * şehir ve rehber sayfaları) bu kontrolün DIŞINDA kalır — canlı taramada bulunan 29
 * uzun başlığın bir kısmı oradan geliyordu. O sayfalar için başlığı üreten şablonun
 * kendisi kısa tutulmalı; buradaki kontrol onları yakalayamaz.
 */

const APP = path.join(process.cwd(), "src", "app");
const TITLE_MAX = 60;
const DESC_MAX = 160;
/** Kök layout: `title.template = "%s · Markala"` — absolute olmayan başlıklara eklenir. */
const SABLON_EKI = " · Markala";

/**
 * Henüz düzeltilmemiş sayfalar (2026-08-31 itibarıyla). Buraya YENİ giriş EKLEME —
 * liste yalnız küçülmek için var; bir sayfanın metni kısaltıldığında buradan çıkarılır
 * ve ikinci test bunu zaten zorunlu kılar.
 */
const BILINEN_UZUN = new Set<string>([
  "hakkimizda/page.tsx",
  "kampanyalar/layout.tsx",
  "kategoriler/layout.tsx",
  "kurumsal/basvuru/layout.tsx",
  "kurumsal/page.tsx",
  "kvkk-basvuru/layout.tsx",
  "matbaa/page.tsx",
  "numune-talebi/layout.tsx",
  "referanslar/layout.tsx",
  "sozluk/page.tsx",
  "teklif-al/layout.tsx",
  "urunler/layout.tsx",
  "yardim/page.tsx",
  "yardim/sss/page.tsx",
]);

function dosyalariTopla(dir: string, out: string[] = []): string[] {
  for (const ad of fs.readdirSync(dir)) {
    const tam = path.join(dir, ad);
    if (fs.statSync(tam).isDirectory()) dosyalariTopla(tam, out);
    else if (/^(page|layout)\.tsx$/.test(ad)) out.push(tam);
  }
  return out;
}

/** Kaynak dosyadan statik metadata metinlerini çıkar (dinamik/şablonlu olanlar atlanır). */
function metadataMetinleri(kaynak: string): { title?: string; description?: string } {
  const sonuc: { title?: string; description?: string } = {};

  // Kök layout'ta `template: "%s · Markala"` var → `absolute` KULLANMAYAN her sayfanın
  // GÖRÜNEN başlığı bu eki de taşır. SERP'te kesilen şey görünen başlık olduğu için
  // ölçüm ekle birlikte yapılır; aksi halde 51 karakterlik bir başlık "kısa" sanılır
  // ama kullanıcıya 61 karakter olarak gider.
  const mutlak = kaynak.match(/\b(?:absolute):\s*"((?:[^"\\]|\\.)*)"/);
  const duz = kaynak.match(/\btitle:\s*"((?:[^"\\]|\\.)*)"/);
  if (mutlak) sonuc.title = mutlak[1];
  else if (duz) sonuc.title = duz[1] + SABLON_EKI;

  // description: "..."  — Prettier çok satıra bölebildiği için tek parça literal aranır.
  const d = kaynak.match(/\bdescription:\s*\n?\s*"((?:[^"\\]|\\.)*)"/);
  if (d) sonuc.description = d[1];

  return sonuc;
}

describe("SERP bütçesi — başlık ve meta açıklama uzunluğu", () => {
  const dosyalar = dosyalariTopla(APP);

  it("yeni sayfalarda başlık ≤60, açıklama ≤160 karakter", () => {
    const ihlaller: string[] = [];

    for (const tam of dosyalar) {
      const goreli = path.relative(APP, tam).split(path.sep).join("/");
      if (BILINEN_UZUN.has(goreli)) continue;

      const kaynak = fs.readFileSync(tam, "utf-8");
      if (!/export const metadata/.test(kaynak)) continue;

      const { title, description } = metadataMetinleri(kaynak);
      if (title && title.length > TITLE_MAX) {
        ihlaller.push(`${goreli} → başlık ${title.length} kr (>${TITLE_MAX}): "${title}"`);
      }
      if (description && description.length > DESC_MAX) {
        ihlaller.push(`${goreli} → açıklama ${description.length} kr (>${DESC_MAX})`);
      }
    }

    expect(
      ihlaller,
      `SERP bütçesi aşıldı. Google başlığın ~60, açıklamanın ~160 karakterden fazlasını keser.\n` +
        `Metni kısalt; gerçekten kaçınılmazsa dosyayı tests/unit/meta-uzunluk.test.ts içindeki\n` +
        `BILINEN_UZUN listesine EKLEME — o liste yalnız küçülmek için var.\n\n` +
        ihlaller.join("\n"),
    ).toEqual([]);
  });

  it("BILINEN_UZUN listesi bayat girdi taşımıyor (düzeltilen çıkarılmalı)", () => {
    const bayat: string[] = [];

    for (const goreli of BILINEN_UZUN) {
      const tam = path.join(APP, goreli);
      if (!fs.existsSync(tam)) {
        bayat.push(`${goreli} → dosya artık yok`);
        continue;
      }
      const { title, description } = metadataMetinleri(fs.readFileSync(tam, "utf-8"));
      const uzunBaslik = !!title && title.length > TITLE_MAX;
      const uzunAciklama = !!description && description.length > DESC_MAX;
      if (!uzunBaslik && !uzunAciklama) bayat.push(`${goreli} → artık sınırlar içinde`);
    }

    expect(
      bayat,
      `Bu dosyalar düzelmiş. BILINEN_UZUN listesinden ÇIKAR ki bir daha bozulursa test yakalasın:\n` +
        bayat.join("\n"),
    ).toEqual([]);
  });
});
