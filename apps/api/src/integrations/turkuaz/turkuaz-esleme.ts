/**
 * Turkuaz beslemesi → Markala katalog eşleme kuralları — SAF modül (I/O yok).
 *
 * İŞ KARARLARI (Hasan, 2026-09-17):
 *  - Satış fiyatı = Turkuaz LİSTE fiyatı (bayi iskontomuz %40 → maliyet = liste × 0,60).
 *  - Baskısız ürün bize gelir, baskıyı Markala yapar → üretim süresi 5-7 iş günü.
 *  - "Matbaa Ürünleri" kök kategorisi HARİÇ (kendi üretimimizle çakışır), kalan her şey alınır.
 *
 * FİYAT ŞEKLİ — emlak-afisi reçetesi (scripts/katalog/emlak-afisi.mjs başlık yorumu):
 *  - "renk" grubu groupRole=priced, groupSort=0 → varyant ekseni (SKU başına bir seçenek).
 *  - "adet" grubu groupRole=dimension, groupSort=1 → TEK boyut grubu olduğu için
 *    priceDimKey olur ve motorun doğrusal `unit × qty × hacim indirimi` yolu tamamen
 *    devre dışı kalır. Fiyatlar (renk, adet) başına TAM MATRİS satırıdır: price = birim × adet.
 *    Hacim indirimi Turkuaz tarafında olmadığı için sızmaması ŞARTTIR (spec doğrular).
 *  - Minimum sipariş, KÜÇÜK KADEMENİN HİÇ SUNULMAMASI ile uygulanır (emlak-afişi deseni):
 *    en düşük adet seçeneği = minimum; müşteri altını seçemez.
 *
 * KDV: beslemedeki <fiyat> KDV HARİÇ varsayılır (<kdv> oranının ayrıca verilmesi bunu işaret
 * eder) → satış = liste × (1 + kdv/100). Bayi panelinden aksi doğrulanırsa servis
 * `fiyatKdvDahil: true` geçirir ve liste önce KDV'den arındırılır. Maliyet HER ZAMAN KDV
 * hariç yazılır (kâr motoru maliyetleri KDV'siz bekler): maliyet = liste_hariç × 0,60.
 */
import { TurkuazKategori, TurkuazSku, kokKategori } from "./turkuaz-xml";

export const TEDARIKCI = "turkuaz";
/** Bayi iskontosu sonrası maliyet çarpanı (%40 iskonto → liste × 0,60). */
export const MALIYET_CARPANI = 0.6;
export const URETIM_SURESI = "5-7 iş günü";
/** Beslemenin "boş geldi, her şeyi pasifleme" sigortası: bundan az aktif SKU varsa senkron durur. */
export const ASGARI_SKU_SAYISI = 200;

/** Turkuaz kök kategorisi → bizim kategori slug'ımız. Listede olmayan kök → çeşitli. */
const KATEGORI_ESLEME: ReadonlyArray<readonly [kokAdi: string, slug: string]> = [
  ["Kalemler", "promosyon-kalem"],
  ["Kalem Setleri", "promosyon-kalem"],
  ["Termos ve Kupa Bardaklar", "promosyon-bardak-termos"],
  ["Teknolojik Ürünler", "promosyon-teknoloji"],
  ["Tarihli Ajanda", "promosyon-defter-ajanda"], // "Tarihli Ajanda • Organizer" — önek eşleşir
  ["Tarihsiz Defterler", "promosyon-defter-ajanda"],
  ["Anahtarlıklar", "promosyon-anahtarlik"],
  ["Tekstil Ürünleri", "promosyon-tekstil"],
  ["Sekreterlikler ve Çantalar", "promosyon-canta"],
  ["Duvar Saatleri", "promosyon-saat"],
  ["Vip Hediyelik Set", "promosyon-vip-set"],
] as const;
const VARSAYILAN_SLUG = "promosyon-cesitli";
const HARIC_KOKLER = ["Matbaa Ürünleri"];

/** Yeni kategori oluştururken kullanılacak vitrin metinleri (senkron var olanı EZMEZ). */
export const KATEGORI_TANIMLARI: Record<
  string,
  { name: string; shortDescription: string; longDescription: string }
> = {
  "promosyon-kalem": {
    name: "Promosyon Kalem",
    shortDescription: "Logo baskılı plastik, metal ve roller kalemler — kurumsal hediyenin klasiği.",
    longDescription:
      "Firmanıza özel logo baskılı promosyon kalemler: plastik, metal, roller ve dokunmatik uçlu modeller, kalem setleri. Fuar, tanıtım ve kurumsal hediye için yüksek adetlerde uygun fiyat.",
  },
  "promosyon-bardak-termos": {
    name: "Promosyon Bardak & Termos",
    shortDescription: "Baskılı kupa, termos ve mataralar — her gün elde taşınan reklam.",
    longDescription:
      "Logo baskılı porselen kupalar, çelik termoslar, mataralar ve kahve bardakları. Süblimasyon ve UV baskı ile kalıcı görsel; ofis ve saha ekipleri için ideal kurumsal hediye.",
  },
  "promosyon-teknoloji": {
    name: "Promosyon Teknoloji",
    shortDescription: "USB bellek, powerbank, kablosuz şarj ve masaüstü teknoloji hediyeleri.",
    longDescription:
      "Kurumsal logolu USB bellekler, powerbank'ler, kablosuz şarj üniteleri ve teknoloji aksesuarları. Kapasite ve model seçenekleriyle bütçenize uygun teknolojik promosyon.",
  },
  "promosyon-defter-ajanda": {
    name: "Promosyon Defter & Ajanda",
    shortDescription: "Logo baskılı tarihli ajandalar, tarihsiz defterler ve organizerlar.",
    longDescription:
      "Firmanıza özel tarihli ajanda, tarihsiz defter, bloknot ve organizer modelleri. Termo deri kapaklar, sıcak baskı ve gofre logo seçenekleriyle yıl boyu masada kalan tanıtım.",
  },
  "promosyon-anahtarlik": {
    name: "Promosyon Anahtarlık",
    shortDescription: "Metal, deri ve plastik logo baskılı anahtarlıklar ve rozetler.",
    longDescription:
      "Metal döküm, deri ve plastik anahtarlıklar, açacaklı ve ledli modeller, rozetler. Düşük maliyetle geniş kitleye ulaşan, en çok tercih edilen promosyon kalemlerinden.",
  },
  "promosyon-tekstil": {
    name: "Promosyon Tekstil",
    shortDescription: "Baskılı tişört, şapka, yağmurluk ve polar — giyilebilir reklam.",
    longDescription:
      "Logo baskılı tişörtler, şapkalar, yağmurluklar ve polarlar. Organizasyon, saha ekibi ve etkinlikler için beden seçenekli, dayanıklı kurumsal tekstil ürünleri.",
  },
  "promosyon-canta": {
    name: "Promosyon Çanta & Sekreterlik",
    shortDescription: "Evrak çantaları, sekreterlikler, bez ve termo çantalar.",
    longDescription:
      "Kurumsal logolu evrak çantaları, sekreterlikler, bez çantalar ve termo çantalar. Toplantı, fuar ve kongre setleri için şık ve işlevsel promosyon çözümleri.",
  },
  "promosyon-saat": {
    name: "Promosyon Saat",
    shortDescription: "Logo baskılı duvar ve masa saatleri — ofiste kalıcı görünürlük.",
    longDescription:
      "Firmanıza özel duvar saatleri ve masa saatleri; plastik, alüminyum ve ahşap kasa seçenekleri. Ofis duvarında yıllarca kalan etkili bir tanıtım aracı.",
  },
  "promosyon-vip-set": {
    name: "VIP Hediye Setleri",
    shortDescription: "Deri, kalem ve aksesuar kombinli premium kurumsal hediye kutuları.",
    longDescription:
      "Yönetici ve önemli müşterileriniz için premium VIP hediye setleri: deri cüzdan, kalem, ajanda ve aksesuar kombinasyonları, özel kutularında logo baskılı olarak hazırlanır.",
  },
  "promosyon-cesitli": {
    name: "Promosyon Çeşitleri",
    shortDescription: "Çakmak, masaüstü, kişisel ve geri dönüşümlü promosyon ürünleri.",
    longDescription:
      "Çakmaklar, masaüstü ürünler, kişisel aksesuarlar, geri dönüşümlü ve tohumlu ürünler dahil geniş promosyon yelpazesi. Aradığınız ürünü bulamadıysanız bize ulaşın; tedarik ağımızla temin edelim.",
  },
};

export interface TurkuazGrup {
  kodgrup: string;
  isim: string;
  aciklama: string;
  kdv: number;
  kategoriSlug: string;
  /// Yalnız satılabilir SKU'lar: durum=1, fiyat>0. Stoksuzlar da listede (seçenek dışı bırakılır).
  skular: TurkuazSku[];
}

export interface EslemeSonucu {
  gruplar: TurkuazGrup[];
  /// Matbaa/pasif/fiyatsız gibi sebeplerle atlananların sayacı (log için).
  atlanan: { matbaa: number; pasif: number; fiyatsiz: number; koksuz: number };
}

/** Beslemedeki SKU'ları satılabilir ürün gruplarına indirger ve kategorilere eşler. */
export function gruplaVeEsle(
  skular: ReadonlyArray<TurkuazSku>,
  kategoriler: ReadonlyArray<TurkuazKategori>,
): EslemeSonucu {
  const atlanan = { matbaa: 0, pasif: 0, fiyatsiz: 0, koksuz: 0 };
  const byGrup = new Map<string, TurkuazSku[]>();

  for (const sku of skular) {
    if (!sku.durum) {
      atlanan.pasif++;
      continue;
    }
    if (sku.fiyat <= 0) {
      atlanan.fiyatsiz++;
      continue;
    }
    const kok = kokKategori(sku.kid, kategoriler);
    if (!kok) {
      atlanan.koksuz++;
      continue;
    }
    if (HARIC_KOKLER.some((h) => kok.isim.startsWith(h))) {
      atlanan.matbaa++;
      continue;
    }
    const list = byGrup.get(sku.kodgrup) ?? [];
    list.push(sku);
    byGrup.set(sku.kodgrup, list);
  }

  const gruplar: TurkuazGrup[] = [];
  for (const [kodgrup, list] of byGrup) {
    // En zengin açıklamayı taşıyan SKU grubu temsil eder (çoğu grupta açıklama aynıdır).
    const temsil = [...list].sort((a, b) => b.aciklama.length - a.aciklama.length)[0];
    const kok = kokKategori(temsil.kid, kategoriler);
    const es = KATEGORI_ESLEME.find(([ad]) => (kok?.isim ?? "").startsWith(ad));
    gruplar.push({
      kodgrup,
      isim: temsil.isim,
      aciklama: temsil.aciklama,
      kdv: temsil.kdv,
      kategoriSlug: es?.[1] ?? VARSAYILAN_SLUG,
      skular: list.sort((a, b) => a.kod.localeCompare(b.kod, "tr")),
    });
  }
  gruplar.sort((a, b) => a.kodgrup.localeCompare(b.kodgrup, "tr"));
  return { gruplar, atlanan };
}

/** "*Minimum Sipariş 100 adettir." / "Minimum sipariş: 45 adet" kalıplarından adedi çıkarır. */
export function minSiparisAyikla(aciklama: string): number | null {
  const m = aciklama.match(/minimum\s+sipari[şs][:\s]*([\d.]+)\s*adet/i);
  if (!m) return null;
  const n = parseInt(m[1].replace(/\./g, ""), 10);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/**
 * Adet kademeleri. Açıklamada minimum varsa merdiven ondan başlar (altı HİÇ sunulmaz).
 * Minimum yazmıyorsa birim fiyata göre makul bir başlangıç seçilir: pahalı ürün (VIP set,
 * deri ajanda) tek adet alınabilir; ucuz üründe (kalem, anahtarlık) 25 altı sipariş
 * operasyon maliyetini karşılamaz. Sabitler bilinçli olarak burada — panelden değil,
 * koddan yönetilir; değişiklik istenirse tek satır.
 */
export function adetKademeleri(minSiparis: number | null, birimListe: number): number[] {
  const MERDIVEN = [1, 2, 5, 10, 25, 50, 100, 250, 500, 1000, 2500];
  const min =
    minSiparis ?? (birimListe >= 1000 ? 1 : birimListe >= 300 ? 5 : 25);
  const ustu = MERDIVEN.filter((k) => k >= min);
  const kademeler = ustu.length > 0 ? ustu : [min];
  if (kademeler[0] !== min) kademeler.unshift(min);
  // En fazla 6 kademe: konfigüratörde okunaklı kalsın, matris satır sayısı patlamasın.
  return kademeler.slice(0, 6);
}

const TR_MAP: Record<string, string> = {
  ç: "c", Ç: "c", ğ: "g", Ğ: "g", ı: "i", İ: "i", ö: "o", Ö: "o",
  ş: "s", Ş: "s", ü: "u", Ü: "u", â: "a", Â: "a", î: "i", Î: "i", û: "u", Û: "u",
};

export function slugla(metin: string): string {
  return metin
    .split("")
    .map((c) => TR_MAP[c] ?? c)
    .join("")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

/**
 * "*Madde\r\n*Madde" biçimindeki tedarikçi açıklamasını okunur maddelere çevirir.
 * Bazı kayıtlarda maddeler satır sonu YERİNE satır içi "*" ile ayrılır
 * ("Baskı: UV*Ebat: 23 cm*Deri kapak") — o yüzden her iki ayraçta da bölünür.
 */
export function aciklamaTemizle(aciklama: string): string {
  const satirlar = aciklama
    .split(/\r?\n|\*/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return satirlar.map((s) => `• ${s}`).join("\n");
}

function yuvarla2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface UrunYuku {
  slug: string;
  name: string;
  kategoriSlug: string;
  shortDescription: string;
  description: string;
  basePrice: number;
  productionTime: string;
  content: Record<string, unknown>;
  options: Array<{
    groupKey: string;
    groupLabel: string;
    groupRole: "priced" | "dimension";
    groupSort: number;
    optionKey: string;
    optionLabel: string;
    optionSublabel: string | null;
    optionSort: number;
    locked: boolean;
    rules: null;
  }>;
  prices: Array<{
    groupKey: string;
    optionKey: string;
    dimKey: string;
    price: number;
    cost: number;
  }>;
  /// Ürün görselleri: tedarikçi URL sırası (indirme servisi bizim URL'lere çevirir).
  gorselKaynaklari: string[];
  aktif: boolean;
  /// Senkron karşılaştırması için içerik özeti (stok+fiyat+SKU listesi).
  ozetHash: string;
}

/**
 * Bir tedarikçi grubunu Markala ürün yüküne çevirir.
 *
 * Varyant ekseni SKU'nun kendisidir (optionKey = tedarikçi SKU kodu): renk varyasyonlarında
 * etiket renk adı, ebat varyasyonlarında ebat, ikisi de boşsa "Standart". SKU bazlı anahtar
 * hem benzersizliği garanti eder hem stok/fiyatı doğrudan SKU'ya bağlar (27 grupta renkler
 * FARKLI fiyatlıdır — matris bunu doğal karşılar).
 *
 * Stoksuz SKU seçenek olarak HİÇ yazılmaz (bugünkü tek stok kolu: seçenek yokluğu).
 * Hiç stoklu SKU kalmazsa ürün pasife düşer, kayıt silinmez.
 */
export function grupToYuk(
  grup: TurkuazGrup,
  fiyatKdvDahil: boolean,
): UrunYuku {
  const kdvCarpan = 1 + grup.kdv / 100;
  const stoklular = grup.skular.filter((s) => s.stok > 0);
  const aktif = stoklular.length > 0;
  const varyantlar = aktif ? stoklular : grup.skular.slice(0, 1);

  const minListe = Math.min(...varyantlar.map((s) => s.fiyat));
  const listeHaric = (liste: number) => (fiyatKdvDahil ? liste / kdvCarpan : liste);

  const minSiparis = minSiparisAyikla(grup.aciklama);
  const kademeler = adetKademeleri(minSiparis, yuvarla2(listeHaric(minListe) * kdvCarpan));

  const renkliSayisi = new Set(varyantlar.map((v) => v.renk).values()).size;
  const coklu = varyantlar.length > 1;

  const options: UrunYuku["options"] = [];
  varyantlar.forEach((v, i) => {
    const etiket = v.renk || v.ebat || "Standart";
    options.push({
      groupKey: "renk",
      groupLabel: renkliSayisi > 1 ? "Renk" : "Model",
      groupRole: "priced",
      groupSort: 0,
      optionKey: v.kod,
      optionLabel: etiket,
      optionSublabel: v.renk && v.ebat ? v.ebat : null,
      optionSort: i,
      locked: !coklu,
      rules: null,
    });
  });
  kademeler.forEach((k, i) => {
    options.push({
      groupKey: "adet",
      groupLabel: "Adet",
      groupRole: "dimension",
      groupSort: 1,
      optionKey: String(k),
      optionLabel: `${k} adet`,
      optionSublabel: i === 0 && (minSiparis ?? 0) > 1 ? "Minimum sipariş" : null,
      optionSort: i,
      locked: false,
      rules: null,
    });
  });

  const prices: UrunYuku["prices"] = [];
  for (const v of varyantlar) {
    const haric = listeHaric(v.fiyat);
    for (const k of kademeler) {
      prices.push({
        groupKey: "renk",
        optionKey: v.kod,
        dimKey: String(k),
        price: yuvarla2(haric * kdvCarpan * k),
        cost: yuvarla2(haric * MALIYET_CARPANI * k),
      });
    }
  }

  const ebatlar = [...new Set(grup.skular.map((s) => s.ebat).filter(Boolean))];
  const temizAciklama = aciklamaTemizle(grup.aciklama);
  // Kısa açıklamaya ilk GERÇEK özellik alınır — "Minimum sipariş" idari bilgidir, vitrine çıkmaz.
  const ilkOzellik =
    temizAciklama
      .split("\n")
      .map((s) => s.replace(/^•\s*/, ""))
      .find((s) => s && !/minimum/i.test(s)) ?? "";

  // Hash SÜRÜM + KDV bayrağı taşır: eşleme kuralları ya da KDV yorumu değişirse
  // "değişmeyen" hızlı yolu düşer ve tüm fiyat matrisi yeniden yazılır.
  const ozet =
    `v1:${fiyatKdvDahil ? "D" : "H"}:` +
    varyantlar
      .map((v) => `${v.kod}:${v.stok}:${v.fiyat}`)
      .sort()
      .join("|");

  return {
    slug: slugla(`promosyon ${grup.isim} ${grup.kodgrup}`),
    name: `${grup.isim} ${grup.kodgrup}`,
    kategoriSlug: grup.kategoriSlug,
    shortDescription:
      `Logo baskılı ${grup.isim}${ilkOzellik ? ` — ${ilkOzellik}` : ""}`.slice(0, 160),
    description:
      `${temizAciklama}\n• Fiyata firmanıza özel logo baskısı dahildir.\n• Ürün kodu: ${grup.kodgrup}`,
    basePrice: yuvarla2(listeHaric(minListe) * kdvCarpan),
    productionTime: URETIM_SURESI,
    content: {
      sku: grup.kodgrup,
      brand: "Markala Promosyon",
      supplier: { name: TEDARIKCI, kodgrup: grup.kodgrup },
      ...(ebatlar.length > 0
        ? { specifications: ebatlar.map((e) => ({ label: "Ebat", value: e })) }
        : {}),
    },
    options,
    prices,
    gorselKaynaklari: gorselSirasi(grup),
    aktif,
    ozetHash: ozet,
  };
}

/**
 * Grup görselleri — tekrarsız, en fazla 6. SIRA BİLİNÇLİ (2026-09-17 örnek incelemesi):
 * SKU görseli (resim1) DÜZ ürün fotoğrafıdır → ana görsel olur; kodgrup görseli ise
 * Turkuaz'ın ESKİ MÜŞTERİLERİNİN logolu baskı örneklerini içeren kolajdır → galeriye
 * 2. sıraya gider. Ana görselde üçüncü taraf logosu görünmesin (Hasan, görsel sorusu).
 */
export function gorselSirasi(grup: TurkuazGrup): string[] {
  const out: string[] = [];
  const ekle = (u: string) => {
    if (u && !out.includes(u) && out.length < 6) out.push(u);
  };
  for (const s of grup.skular) {
    const ilk = s.resimler.find((u) => !u.includes("/kodgrup/"));
    if (ilk) {
      ekle(ilk);
      break; // ana görsel: ilk SKU'nun düz fotoğrafı
    }
  }
  const kodgrupResmi = grup.skular
    .flatMap((s) => s.resimler)
    .find((u) => u.includes("/kodgrup/"));
  if (kodgrupResmi) ekle(kodgrupResmi);
  for (const s of grup.skular) {
    const ilk = s.resimler.find((u) => !u.includes("/kodgrup/"));
    if (ilk) ekle(ilk);
  }
  for (const u of grup.skular.flatMap((s) => s.resimler)) ekle(u);
  return out;
}
