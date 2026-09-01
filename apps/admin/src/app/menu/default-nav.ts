/**
 * Header menüsü editörü tipleri + FABRİKA VARSAYILANI (Faz 1).
 * Storefront site-header.tsx içindeki DEFAULT_NAV'ın aynısı — admin "Varsayılana Dön"
 * dediğinde bu yüklenir. DB'deki header_nav kaydı kaydedilince asıl kaynak DB olur.
 * (Storefront kayıt yoksa kendi DEFAULT_NAV'ına düşer; bu kopya admin'in başlangıç içeriğidir.)
 */
export type NavFeatured = { slug: string; label: string; theme?: "brand" | "paper" | "ink" };
export type NavItem = { label: string; href: string; badge?: string };
export type NavGroup = { title: string; items: NavItem[] };
export type NavCategory = {
  label: string;
  href: string;
  groups?: NavGroup[];
  featured?: NavFeatured[];
  highlight?: "fire" | "new";
};

export const DEFAULT_NAV: NavCategory[] = [
  {
    label: "Kartvizit & Kırtasiye",
    href: "/urunler",
    groups: [
      { title: "Kartvizit", items: [{ label: "Klasik Kartvizit (21 paket)", href: "/urun/klasik-kartvizit" }] },
      {
        title: "Kâğıt Ürünleri",
        items: [
          { label: "Antetli Kağıt", href: "/urun/antetli-kagit" },
          { label: "Diplomat Zarf - Tek Renk", href: "/urun/zarf-diplomat-tek-renk" },
          { label: "Diplomat Zarf - Renkli", href: "/urun/zarf-diplomat-renkli" },
          { label: "Torba Zarf 24×32", href: "/urun/zarf-torba" },
          { label: "Cepli Dosya", href: "/urun/cepli-dosya" },
          { label: "Makbuz NCR", href: "/urun/makbuz" },
        ],
      },
    ],
    featured: [
      { slug: "klasik-kartvizit", label: "Klasik Kartvizit", theme: "brand" },
      { slug: "antetli-kagit", label: "Antetli Kağıt", theme: "paper" },
    ],
  },
  {
    label: "Broşür & El İlanı",
    href: "/urunler",
    groups: [
      {
        title: "Broşür",
        items: [
          { label: "Broşür 115 gr Çift Yön", href: "/urun/brosur" },
          { label: "Pro Broşür 128 gr", href: "/urun/pro-brosur" },
          { label: "Selefonlu Broşür 200 gr", href: "/urun/selefonlu-brosur" },
          { label: "Kapı Askı Broşür", href: "/urun/kapi-aski-brosur" },
        ],
      },
      {
        title: "Diğer",
        items: [
          { label: "El İlanı 105 gr", href: "/urun/el-ilani" },
          { label: "Afiş 105 gr", href: "/urun/afis-105gr" },
          { label: "Etiket Çıkartma", href: "/urun/etiket" },
        ],
      },
    ],
    featured: [
      { slug: "selefonlu-brosur", label: "Selefonlu Broşür", theme: "paper" },
      { slug: "el-ilani", label: "El İlanı 105 gr", theme: "brand" },
    ],
  },
  {
    // Vinil/Mesh branda "Dijital Baskı" sekmesine taşındı (2026-08-28) → ad güncellendi.
    label: "Bayrak & Stand",
    href: "/urunler",
    groups: [
      {
        title: "Bayrak",
        items: [
          { label: "Yelken Bayrak", href: "/urun/yelken-bayrak-damla" },
          { label: "Kırlangıç Bayrak", href: "/urun/kirlangic-bayrak-3m" },
          { label: "Masa Bayrağı", href: "/urun/masa-bayragi-krom" },
          { label: "Makam Bayrağı", href: "/urun/makam-bayragi-puskullu" },
        ],
      },
      {
        title: "Stand",
        items: [{ label: "Roll-up 85×200", href: "/urun/rollup-standart" }],
      },
    ],
    featured: [
      { slug: "yelken-bayrak-damla", label: "Yelken Bayrak", theme: "ink" },
      { slug: "rollup-standart", label: "Roll-Up Banner", theme: "brand" },
    ],
  },
  {
    label: "Promosyon & Hediye",
    href: "/urunler",
    groups: [
      {
        title: "Promosyon",
        items: [
          { label: "Sublime Kupa", href: "/urun/klasik-beyaz-kupa" },
          { label: "Promosyon Magnet 46×68", href: "/urun/magnet-promosyon" },
          { label: "Plaket", href: "/urun/kristal-plaket" },
          { label: "Madalya", href: "/urun/madalya-7cm-kurdela" },
        ],
      },
      {
        title: "Bloknot Ailesi",
        items: [
          { label: "Küp Bloknot", href: "/urun/kup-bloknot" },
          { label: "Spiralli Bloknot", href: "/urun/spiralli-bloknot" },
          { label: "Kapaklı Bloknot", href: "/urun/kapakli-bloknot" },
          { label: "Notluk Premium", href: "/urun/notluk" },
        ],
      },
    ],
    featured: [
      { slug: "klasik-beyaz-kupa", label: "Sublime Kupa", theme: "brand" },
      { slug: "magnet-promosyon", label: "Promosyon Magnet", theme: "paper" },
    ],
  },
  {
    // Dekota / Folyo / Araç Sticker "Dijital Baskı"ya taşındı — çakışma bırakılmadı.
    label: "Reklam Tabela",
    href: "/urunler",
    groups: [
      {
        title: "Tabela & Levha",
        items: [
          { label: "Lightbox LED", href: "/urun/lightbox-led-100cm" },
          { label: "Güvenlik Levhası", href: "/urun/guvenlik-levhasi-sigorta" },
          { label: "Fosforlu Acil Çıkış", href: "/urun/fosforlu-cikis-folyo" },
          { label: "Plastik Duba", href: "/urun/plastik-duba-baskili" },
          { label: "Araç Magneti", href: "/urun/arac-magneti-30x40" },
        ],
      },
    ],
    featured: [
      { slug: "lightbox-led-100cm", label: "Lightbox LED", theme: "ink" },
      { slug: "arac-magneti-30x40", label: "Araç Magneti", theme: "paper" },
    ],
  },
  {
    // DİJİTAL BASKI (2026-08-28) — m² hesaplı baskı hizmetleri, Reklam Tabela'nın yanında.
    label: "Dijital Baskı",
    href: "/urunler",
    groups: [
      {
        title: "Vinil & Branda",
        items: [
          { label: "Vinil Branda 440 gr", href: "/urun/vinil-branda-440gr" },
          { label: "Mesh Branda", href: "/urun/mesh-branda" },
          { label: "Araç Sticker", href: "/urun/arac-sticker-yan" },
        ],
      },
      {
        title: "Folyo & Film",
        items: [
          { label: "Folyo Çeşitleri", href: "/urun/folyo-cesitleri" },
          { label: "Baskes Folyo", href: "/urun/baskes-folyo" },
          { label: "One Way Vision", href: "/urun/one-way-vision-baski" },
          { label: "UV DTF Baskı", href: "/urun/uv-dtf-baski" },
          { label: "Duvar Kağıdı", href: "/urun/duvar-kagidi-baski" },
        ],
      },
      {
        title: "Levha & Tablo",
        items: [
          { label: "Dekota / Foreks Baskı", href: "/urun/dekota-baski-5mm" },
          { label: "Pleksi Baskı", href: "/urun/pleksi-baski" },
          { label: "Kompozit Baskı", href: "/urun/kompozit-baski" },
          { label: "Kanvas Tablo Baskı", href: "/urun/kanvas-tablo-baski" },
        ],
      },
    ],
    featured: [
      { slug: "vinil-branda-440gr", label: "Vinil Branda", theme: "brand" },
      { slug: "dekota-baski-5mm", label: "Dekota Baskı", theme: "paper" },
    ],
  },
  {
    label: "Restoran & Otel",
    href: "/urunler",
    groups: [
      {
        title: "Hizmet Sektörü",
        items: [
          { label: "Amerikan Servis", href: "/urun/amerikan-servis" },
          { label: "Selefonlu Menü", href: "/urun/selefonlu-brosur" },
          { label: "Oto Paspas", href: "/urun/oto-paspas" },
          { label: "Çantalar", href: "/urun/canta" },
          { label: "Trodat Kaşe", href: "/urun/trodat-printy-4912" },
        ],
      },
    ],
    featured: [
      { slug: "amerikan-servis", label: "Amerikan Servis", theme: "paper" },
      { slug: "trodat-printy-4912", label: "Trodat Kaşe", theme: "brand" },
    ],
  },
  {
    label: "İSG Uyarı Levhaları",
    href: "/urunler",
    groups: [
      {
        title: "İş Güvenliği Levhaları",
        items: [
          { label: "Uyarı / İkaz Levhaları", href: "/kategori/is-guvenligi-uyari-ikaz" },
          { label: "Yasaklayıcı Levhalar", href: "/kategori/is-guvenligi-yasaklayici" },
          { label: "Emredici / KKD Levhaları", href: "/kategori/is-guvenligi-emredici-kkd" },
          { label: "Acil Durum & İlk Yardım", href: "/kategori/is-guvenligi-acil-ilk-yardim" },
          { label: "Yangınla Mücadele", href: "/kategori/is-guvenligi-yangin" },
        ],
      },
      {
        title: "Özel & Sektörel Levhalar",
        items: [
          { label: "Elektrik & Voltaj", href: "/kategori/is-guvenligi-elektrik-voltaj" },
          { label: "Güneş Enerjisi (GES)", href: "/kategori/is-guvenligi-ges" },
          { label: "Trafik, Saha & Otopark", href: "/kategori/is-guvenligi-trafik-saha" },
          { label: "Kalite Kontrol Etiketleri", href: "/kategori/is-guvenligi-kalite-kontrol" },
          { label: "Bilgilendirme & Talimat", href: "/kategori/is-guvenligi-bilgilendirme-talimat" },
        ],
      },
    ],
  },
];
