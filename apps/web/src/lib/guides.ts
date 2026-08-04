/**
 * Rehber (/rehber/*) kayıt defteri — tek kaynak.
 *
 * /rehber indeksi, sitemap ve kategori sayfalarındaki "ilgili rehber" bloğu
 * bu listeden beslenir; yeni rehber eklerken buraya bir satır eklemek yeterlidir.
 * (Şablon indirme sayfası /rehber/sablonlar araç sayfasıdır, fiyat rehberi değildir —
 * indekste ayrı gösterilir, categorySlugs almaz.)
 */

export interface GuideEntry {
  /** /rehber/<slug> */
  slug: string;
  /** İndeks kartı ve iç link metni */
  title: string;
  /** İndeks kartı açıklaması (1-2 cümle) */
  description: string;
  /** Bu rehberin "ilgili rehber" bloğunda görüneceği kategori slug'ları */
  categorySlugs: string[];
}

export const guides: GuideEntry[] = [
  {
    slug: "kartvizit-fiyatlari-2026",
    title: "Kartvizit Fiyatları 2026",
    description:
      "Selefonlu, UV lakli ve yaldızlı kartvizit fiyatları — adet kırılımı ve kağıt seçim rehberiyle, KDV dahil.",
    categorySlugs: ["kartvizit"],
  },
  {
    slug: "brosur-baski-fiyatlari-2026",
    title: "Broşür Baskı Fiyatları 2026",
    description:
      "A7'den A3'e broşür ve el ilanı fiyatları: ebat × tiraj tablosu, kağıt gramajı rehberi, KDV dahil.",
    categorySlugs: ["brosur", "kapi-aski-brosur"],
  },
  {
    slug: "branda-baski-m2-fiyati-2026",
    title: "Branda Baskı m² Fiyatı 2026",
    description:
      "Vinil branda afiş metrekare fiyatları, ebat önerileri ve montaj aksesuarları rehberi.",
    categorySlugs: ["vinil-branda-afis"],
  },
  {
    slug: "afis-baski-fiyatlari-2026",
    title: "Afiş Baskı Fiyatları 2026",
    description:
      "Kuşe afiş ve poster baskı fiyatları — ebat ve tiraja göre güncel tablo, asım önerileriyle.",
    categorySlugs: ["afis"],
  },
  {
    slug: "rollup-fiyatlari-2026",
    title: "Rollup Fiyatları 2026",
    description:
      "Rollup banner fiyatları, kaset kalitesi farkları ve fuar/etkinlik kullanım rehberi.",
    categorySlugs: ["rollup"],
  },
  {
    slug: "isg-zorunlu-uyari-levhalari",
    title: "İSG Zorunlu Uyarı Levhaları Rehberi",
    description:
      "İşyerinde hangi iş güvenliği levhaları zorunlu? Yasaklayıcı, uyarı, emredici ve acil çıkış işaretleri — işyeri tipine göre kontrol listeleri.",
    categorySlugs: [
      "is-guvenligi-uyari-ikaz",
      "is-guvenligi-yasaklayici",
      "is-guvenligi-emredici-kkd",
      "is-guvenligi-acil-ilk-yardim",
      "is-guvenligi-yangin",
      "is-guvenligi-elektrik-voltaj",
      "is-guvenligi-bilgilendirme-talimat",
      "is-guvenligi-trafik-saha",
      "is-guvenligi-ges",
      "is-guvenligi-kalite-kontrol",
    ],
  },
  {
    slug: "etiket-sticker-baski-fiyatlari-2026",
    title: "Etiket & Sticker Baskı Fiyatları 2026",
    description:
      "Yapışkanlı etiket ve sticker baskı fiyatları: selefonlu/selefonsuz, özel kesim ve yaldız seçenekleriyle 1.000 adet fiyat tablosu.",
    categorySlugs: ["etiket", "arac-sticker", "folyo"],
  },
  {
    slug: "kase-yaptirma-rehberi",
    title: "Kaşe Yaptırma Rehberi",
    description:
      "Otomatik kaşe mi, cep kaşesi mi? Trodat/Shiny/Colop farkları, ebat seçimi ve kaşede bulunması gereken bilgiler.",
    categorySlugs: ["kase"],
  },
  {
    slug: "tabela-fiyatlari-2026",
    title: "Tabela Fiyatları 2026",
    description:
      "Dekota tabela, folyo kesim yazı ve vinil branda karşılaştırması — hangi işletmeye hangi tabela, başlangıç fiyatlarıyla.",
    categorySlugs: ["dekota-baski", "folyo", "vinil-branda-afis"],
  },
];

/** Kategori slug'ına göre ilgili rehberler (kategori sayfası iç link bloğu). */
export function getGuidesForCategory(categorySlug: string): GuideEntry[] {
  return guides.filter((g) => g.categorySlugs.includes(categorySlug));
}
