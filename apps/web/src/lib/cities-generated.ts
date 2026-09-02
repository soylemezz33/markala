/**
 * Şablonla üretilen il sayfaları — elle yazılmış 7 il DIŞINDAKİ 74 il.
 *
 * Neden ayrı dosya: cities.ts'teki 7 il (Mersin, Antalya, Adana, Şanlıurfa,
 * Hatay, Osmaniye, Gaziantep) elle yazılmış özgün içerik taşır — gerçek müşteri
 * referansı, şehre özel ürün kırılımı, şehre özel SSS. Onları ŞABLON EZMEZ.
 * Buradaki 74 il ise tr-locations.ts'teki GERÇEK ilçe verisinden üretilir.
 *
 * İnce içerik (thin content) riskine karşı alınan önlemler:
 * - Her ilin GERÇEK ilçe listesi sayfaya girer (972 ilçelik veri) — sayfalar
 *   birbirinin kopyası olmaz.
 * - localReferences BOŞ bırakılır: o ilde müşterimiz olduğunu iddia etmeyiz
 *   (sayfa bu bölümü otomatik gizler).
 * - "Şubemiz yok" bilgisi açıkça yazılır — yerel varlık iması yapılmaz.
 * - İlçelere ALT SAYFA AÇILMAZ (districts değil districtNames doldurulur);
 *   aksi hâlde 972 ince sayfa üretilirdi.
 */

import type { CityData, Region } from "./cities";
import { TR_PROVINCES } from "./tr-locations";
import { trLoc, trLocAdj, trDat, trGen } from "./tr-suffix";

/** Elle yazılmış iller — şablon bunların üstüne YAZMAZ. */
export const CURATED_SLUGS = new Set([
  "mersin",
  "antalya",
  "adana",
  "sanliurfa",
  "hatay",
  "osmaniye",
  "gaziantep",
]);

/** İl → coğrafi bölge (81 il). */
const REGION_OF: Record<string, Region> = {};
const put = (r: Region, ...iller: string[]) =>
  iller.forEach((i) => (REGION_OF[i] = r));

put(
  "marmara",
  "Balıkesir", "Bilecik", "Bursa", "Çanakkale", "Edirne", "İstanbul",
  "Kırklareli", "Kocaeli", "Sakarya", "Tekirdağ", "Yalova",
);
put(
  "ege",
  "Afyonkarahisar", "Aydın", "Denizli", "İzmir", "Kütahya", "Manisa",
  "Muğla", "Uşak",
);
put(
  "akdeniz",
  "Adana", "Antalya", "Burdur", "Hatay", "Isparta", "Kahramanmaraş",
  "Mersin", "Osmaniye",
);
put(
  "ic-anadolu",
  "Aksaray", "Ankara", "Çankırı", "Eskişehir", "Karaman", "Kayseri",
  "Kırıkkale", "Kırşehir", "Konya", "Nevşehir", "Niğde", "Sivas", "Yozgat",
);
put(
  "karadeniz",
  "Amasya", "Artvin", "Bartın", "Bayburt", "Bolu", "Çorum", "Düzce",
  "Giresun", "Gümüşhane", "Karabük", "Kastamonu", "Ordu", "Rize", "Samsun",
  "Sinop", "Tokat", "Trabzon", "Zonguldak",
);
put(
  "dogu-anadolu",
  "Ağrı", "Ardahan", "Bingöl", "Bitlis", "Elâzığ", "Erzincan", "Erzurum",
  "Hakkâri", "Iğdır", "Kars", "Malatya", "Muş", "Tunceli", "Van",
);
put(
  "guneydogu",
  "Adıyaman", "Batman", "Diyarbakır", "Gaziantep", "Kilis", "Mardin",
  "Siirt", "Şanlıurfa", "Şırnak",
);

/**
 * KARGO süresi (iş günü, üretim HARİÇ) — TÜM İLLERDE AYNI.
 *
 * 2026-09-02 (Hasan kararı: "kargo süresi herkese aynı yaz"): önceden bölgeye
 * göre 2-3 / 3-4 ayrımı vardı ve elle yazılan 7 il 1-2 gün diyordu. Tek değere
 * indirildi; sayfalardaki "komşu ilde daha hızlı" ifadeleri de temizlendi.
 * Değişirse YALNIZ burası ve cities.ts'teki 7 ilin deliveryDays'i güncellenir.
 */
export const KARGO_GUN = { min: 2, max: 4 };

/** Bölgeye özgü bağlam cümlesi — sayfalar birbirinin kopyası olmasın diye. */
const REGION_SENTENCE: Record<Region, string> = {
  marmara:
    "Bölgedeki sanayi ve ticaret yoğunluğu, kurumsal baskı işlerinde süreklilik ve baskıdan baskıya değişmeyen renk standardı gerektirir.",
  ege:
    "Tarım, turizm ve üretim işletmelerinin bir arada olduğu bölgede sezonluk tanıtım işleriyle kalıcı tabela-levha işleri birlikte yürür.",
  akdeniz:
    "Turizm ve tarım işletmelerinin yoğun olduğu bölgede sezon başı toplu menü, broşür ve etiket baskısı öne çıkar.",
  "ic-anadolu":
    "Organize sanayi bölgeleri ve lojistik hatları nedeniyle iş güvenliği levhaları ile kurumsal kimlik ürünleri en çok istenen kalemlerdir.",
  karadeniz:
    "Nem ve yağışın yüksek olduğu bölgede dış mekân işlerinde UV ve suya dayanıklı malzeme seçimi öne çıkar.",
  "dogu-anadolu":
    "Geniş coğrafya nedeniyle işletmeler tek seferde toplu sipariş vermeyi tercih eder; toplu adetlerde birim maliyet düşer.",
  guneydogu:
    "Sanayi ve ticaret hattındaki işletmelerde kurumsal kimlik ürünleri ile iş güvenliği levhaları birlikte talep edilir.",
};

/** Bölge kodu → ekranda görünen ad. */
export const REGION_LABEL: Record<Region, string> = {
  marmara: "Marmara",
  ege: "Ege",
  akdeniz: "Akdeniz",
  "ic-anadolu": "İç Anadolu",
  karadeniz: "Karadeniz",
  "dogu-anadolu": "Doğu Anadolu",
  guneydogu: "Güneydoğu Anadolu",
};

/** /matbaa sayfasında bölümlerin görüneceği sıra — atölyeye yakınlık esaslı. */
export const REGION_ORDER: Region[] = [
  "akdeniz",
  "guneydogu",
  "ic-anadolu",
  "ege",
  "marmara",
  "karadeniz",
  "dogu-anadolu",
];

/** Türkçe il adı → URL slug'ı. Elle yazılmış 7 ilin slug'larıyla birebir uyumlu. */
export function trSlug(s: string): string {
  const map: Record<string, string> = {
    ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i", ö: "o", Ö: "o",
    ş: "s", Ş: "s", ü: "u", Ü: "u",
    â: "a", Â: "a", î: "i", Î: "i", û: "u", Û: "u",
  };
  return s
    .split("")
    .map((ch) => map[ch] ?? ch)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/** Ülke geneli en çok sipariş edilen kalemler — il bazlı bir iddia DEĞİLDİR. */
const CATALOG_HIGHLIGHTS = [
  "Kartvizit — mat/parlak selefon, lak ve gofre seçenekleriyle",
  "Broşür, katalog ve el ilanı",
  "Afiş, poster ve branda",
  "Barkod/ürün etiketi ve sticker",
  "İSG uyarı, zorunluluk ve yasaklayıcı levhaları",
  "Antetli kâğıt, zarf ve kurumsal dosya",
];

const COMMON_NEEDS = [
  "Kurumsal kimlik yenileme: kartvizit, antetli kâğıt ve zarf takımı birlikte",
  "Mağaza/şube açılışı için tabela, vitrin afişi ve branda",
  "Fuar ve etkinlik öncesi katalog, roll-up ve yaka kartı",
  "İş güvenliği denetimi öncesi eksik zorunlu levhaların tamamlanması",
  "Sezonluk kampanya için el ilanı, broşür ve vitrin görseli",
];

/**
 * İlin bölgesini döndürür. Eşleşmeyen il OLMAMALI — tr-locations.ts'e yeni il
 * eklenirse burada da tanımlanana kadar build patlar (sessiz eksik il yerine).
 */
function regionOf(il: string): Region {
  const r = REGION_OF[il];
  if (!r) throw new Error(`cities-generated: bölgesi tanımsız il — ${il}`);
  return r;
}

function buildCity(il: string, ilceler: string[]): CityData {
  const region = regionOf(il);
  const d = KARGO_GUN;
  const n = ilceler.length;

  return {
    slug: trSlug(il),
    name: il,
    region,
    deliveryDays: d,
    sameDayCourier: false,
    curated: false,
    districtNames: ilceler,
    intro:
      `${il}, ${n} ilçesiyle ${REGION_LABEL[region]} bölgesinde yer alır. ` +
      `${REGION_SENTENCE[region]} ` +
      `Markala ${trGen(il)} tamamına Mersin'deki üretim tesisinden hizmet verir: ` +
      `${trLocAdj(il)} işletmeler kartvizit, broşür, afiş, etiket, branda ve İSG ` +
      `levhalarını online sipariş eder, ürünler üretim sonrası ortalama ` +
      `${d.min}-${d.max} iş günü içinde kargoyla adrese teslim edilir. ` +
      `${trLoc(il)} şubemiz yoktur; tüm üretim tek tesiste yapıldığı için ` +
      `fiyatlarımız şehirden şehre değişmez.`,
    popularProducts: CATALOG_HIGHLIGHTS,
    localReferences: [], // o ilde müşterimiz olduğunu İDDİA ETMİYORUZ
    commonNeeds: COMMON_NEEDS,
    faqs: [
      {
        q: `${trDat(il)} kargo kaç günde ulaşır?`,
        a: `Siparişiniz üretime alındıktan sonra kargoya verilir; ${trGen(il)} merkez ve ilçelerine ortalama ${d.min}-${d.max} iş günü içinde ulaşır. Üretim süresi ürüne ve adede göre değişir, ürün sayfasında belirtilir.`,
      },
      {
        q: `${trLoc(il)} şubeniz veya bayiniz var mı?`,
        a: `Hayır. Markala, Mersin'deki tek üretim tesisinden Türkiye geneline hizmet veren online bir matbaadır; ${trLoc(il)} şube veya bayimiz bulunmaz. Siparişinizi internetten verir, ürünü kargoyla teslim alırsınız.`,
      },
      {
        q: `${trGen(il)} hangi ilçelerine gönderim yapıyorsunuz?`,
        a: `${trGen(il)} ${n} ilçesinin tamamına gönderim yapıyoruz: ${ilceler.join(", ")}.`,
      },
      {
        q: `${trLocAdj(il)} işletmeme tasarım desteği veriyor musunuz?`,
        a: `Evet. Baskıya hazır dosyanızı yükleyebilir ya da 324 Ajans tasarım ekibimizden destek alabilirsiniz; logo, kurumsal kimlik ve baskıya hazır dosya hazırlığı yapılır.`,
      },
      {
        q: `${il} için fiyat nasıl öğrenilir?`,
        a: `Ürün sayfasında ölçü, malzeme ve adedi seçtiğinizde KDV dahil güncel fiyat anında hesaplanır. ${trDat(il)} kargo ücreti ve tahmini teslim süresi sepette gösterilir.`,
      },
    ],
  };
}

/** Elle yazılmış 7 il hariç, kalan 74 il. */
export const GENERATED_CITIES: CityData[] = TR_PROVINCES.filter(
  (p) => !CURATED_SLUGS.has(trSlug(p.il)),
).map((p) => buildCity(p.il, p.ilceler));
