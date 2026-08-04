/**
 * Kategori SEO fallback haritası — hedef arama kelimesine göre elle yazılmış
 * title/description. Öncelik sırası (kategori sayfası generateMetadata):
 *
 *   1. DB'deki cat.seo.title / cat.seo.description (admin panelden girilirse KAZANIR)
 *   2. Buradaki curated fallback
 *   3. Jenerik "`${name} Baskı`" fallback'i
 *
 * Kelime hedefleri Semrush TR verisiyle seçildi (2026-08): örn. "uyarı levhaları" 1.000/ay,
 * "iş güvenliği levhaları" 880/ay, "etiket baskı" 2.900/ay, "poster baskı" 1.600/ay.
 * Layout title'a "· Markala" şablonunu ekler — burada marka eki YAZILMAZ.
 */

export interface CategorySeoFallback {
  title: string;
  description: string;
}

const CATEGORY_SEO: Record<string, CategorySeoFallback> = {
  "is-guvenligi-uyari-ikaz": {
    title: "Uyarı Levhaları — İş Güvenliği Uyarı ve İkaz Levhaları",
    description:
      "Sarı zeminli iş güvenliği uyarı levhaları: dikkat, elektrik tehlikesi, sıcak yüzey, kaygan zemin. Folyo, dekota ve fotolüminesan seçenekleriyle — KDV dahil fiyatlarla online sipariş.",
  },
  "is-guvenligi-yasaklayici": {
    title: "Yasaklayıcı Levhalar — Sigara İçilmez, Girilmez Levhaları",
    description:
      "Kırmızı daireli yasaklayıcı iş güvenliği levhaları: sigara içilmez, yetkisiz girilmez, ateşle yaklaşma. Ebat ve malzeme seçenekleriyle KDV dahil online sipariş.",
  },
  "is-guvenligi-emredici-kkd": {
    title: "Emredici İSG Levhaları — Baret ve KKD İşaretleri",
    description:
      "Mavi zeminli emredici iş güvenliği levhaları: baret tak, iş ayakkabısı giy, kulak koruyucu kullan. Şantiye ve fabrika için KDV dahil fiyatlarla online sipariş.",
  },
  "is-guvenligi-acil-ilk-yardim": {
    title: "Acil Çıkış ve İlk Yardım Levhaları",
    description:
      "Yeşil zeminli acil çıkış, toplanma alanı ve ilk yardım levhaları. Fotolüminesan (karanlıkta parlayan) seçenekleriyle — KDV dahil fiyatlarla online sipariş.",
  },
  "is-guvenligi-yangin": {
    title: "Yangın Levhaları — Yangın Söndürücü İşaretleri",
    description:
      "Yangın söndürme cihazı, yangın dolabı ve alarm butonu levhaları. Fotolüminesan ve dekota seçenekleriyle işyeri yangın işaretlemesi — KDV dahil online sipariş.",
  },
  "is-guvenligi-elektrik-voltaj": {
    title: "Elektrik Uyarı Levhaları — Yüksek Gerilim ve Pano Etiketleri",
    description:
      "Elektrik tehlikesi, yüksek gerilim, ölüm tehlikesi ve pano uyarı levhaları. Trafo ve pano işaretlemesi için ebat/malzeme seçenekleriyle KDV dahil online sipariş.",
  },
  "is-guvenligi-kalite-kontrol": {
    title: "Kalite Kontrol Etiketleri — Kontrol ve Onay Etiketi",
    description:
      "Kalite kontrol yapılmıştır, onaylandı, red ve numaratör etiketleri. Üretim ve depo süreçleri için yapışkanlı etiket seçenekleriyle KDV dahil online sipariş.",
  },
  "is-guvenligi-trafik-saha": {
    title: "Trafik ve Saha Levhaları — Şantiye Trafik İşaretleri",
    description:
      "Saha içi trafik levhaları: hız sınırı, forklift, yaya yolu ve araç çıkabilir işaretleri. Şantiye ve fabrika sahası için KDV dahil fiyatlarla online sipariş.",
  },
  "is-guvenligi-ges": {
    title: "GES Uyarı Levhaları — Güneş Enerjisi Santrali İşaretleri",
    description:
      "GES sahaları için DC gerilim, çift besleme ve fotovoltaik sistem uyarı levhaları. Panel ve pano işaretlemesi — KDV dahil fiyatlarla online sipariş.",
  },
  "is-guvenligi-bilgilendirme-talimat": {
    title: "Bilgilendirme ve Talimat Levhaları",
    description:
      "İşyeri talimat, kural ve bilgilendirme levhaları: emniyet kemeri, pano kapağı, çalışma talimatları. Ebat ve malzeme seçenekleriyle KDV dahil online sipariş.",
  },
  etiket: {
    title: "Etiket Baskı — Yapışkanlı Etiket ve Sticker Baskı",
    description:
      "Yapışkanlı etiket ve sticker baskı: selefonlu, selefonsuz, özel kesim ve altın yaldız. Ambalaj, kavanoz ve kargo etiketi için 1.000 adet KDV dahil fiyatlarla.",
  },
  brosur: {
    title: "Broşür Baskı — El İlanı Fiyatları",
    description:
      "A7'den A3'e broşür ve el ilanı baskı: kuşe kağıt, selefon ve gramaj seçenekleri. 1.000 adetten başlayan tirajlarla KDV dahil fiyatlar — sepette değişmez.",
  },
  kartvizit: {
    title: "Kartvizit Baskı — Kartvizit Fiyatları",
    description:
      "Selefonlu, UV lakli ve yaldızlı kartvizit baskı. Premium kağıtlarda çift yön baskı, ücretsiz tasarım desteğiyle — KDV dahil fiyatlarla online sipariş.",
  },
  "vinil-branda-afis": {
    title: "Branda Afiş — Vinil Branda Baskı Fiyatları",
    description:
      "Kuşgözlü vinil branda afiş baskı: metrekare bazlı fiyat, dış mekâna dayanıklı malzeme. İnşaat, kampanya ve etkinlik brandaları — KDV dahil online sipariş.",
  },
  afis: {
    title: "Afiş Baskı — Poster Baskı Fiyatları",
    description:
      "Kuşe afiş ve poster baskı: A3'ten büyük ebatlara, parlak ve mat seçeneklerle. Etkinlik, kampanya ve mağaza içi görsel için KDV dahil fiyatlarla online sipariş.",
  },
  magnet: {
    title: "Magnet Baskı — Reklam Magneti Fiyatları",
    description:
      "Buzdolabı magneti ve reklam magnet baskısı: özel ebat ve şekilli kesim seçenekleri. Promosyon ve tanıtım için KDV dahil fiyatlarla online sipariş.",
  },
  "antetli-kagit": {
    title: "Antetli Kağıt Baskı — Antetli Kağıt Fiyatları",
    description:
      "Kurumsal antetli kağıt baskı: 80-90 gr birinci hamur, tek/çift yön renkli. Zarf ile takım halinde, KDV dahil fiyatlarla online sipariş.",
  },
  "dekota-baski": {
    title: "Dekota Baskı — Dekota Levha Tabela Fiyatları",
    description:
      "Dekota (PVC köpük) levhaya UV baskı: dükkan tabelası, yönlendirme panosu ve kapı isimliği. Ebat bazlı KDV dahil fiyatlarla online sipariş.",
  },
  folyo: {
    title: "Folyo Kesim — Cam Yazısı ve Folyo Fiyatları",
    description:
      "Kesim folyo ile vitrin cam yazısı, araç yazısı ve duvar sloganı. Renk ve ebat seçenekleriyle uygulamaya hazır gönderim — KDV dahil online sipariş.",
  },
  kase: {
    title: "Kaşe Yaptırma — Otomatik Kaşe ve Cep Kaşesi",
    description:
      "Trodat, Shiny ve Colop kaşeler: otomatik, cep ve klasik modeller. Klişe tasarımı ücretsiz, 24 saatte üretim — yuvarlak ve dikdörtgen ebatlarla.",
  },
  rollup: {
    title: "Rollup Banner — Rollup Fiyatları",
    description:
      "Fuar ve etkinlik için rollup banner: kaset + baskı takım halinde, taşıma çantalı. 85×200 standart ebat ve KDV dahil fiyatlarla online sipariş.",
  },
};

/** Kategori slug'ı için curated SEO fallback (yoksa undefined — jenerik fallback devreye girer). */
export function getCategorySeoFallback(slug: string): CategorySeoFallback | undefined {
  return CATEGORY_SEO[slug];
}
