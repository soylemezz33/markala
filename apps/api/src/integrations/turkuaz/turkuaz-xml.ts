/**
 * Turkuaz Promosyon XML besleme ayrıştırıcısı — SAF modül (I/O yok, test edilir).
 *
 * Besleme biçimi (2026-09 itibarıyla gözlemlenen):
 *   <turkuaz><urunler>...alanlar...</urunler><urunler>...</urunler></turkuaz>
 *   <turkuaz><kategoriler><kid>..</kid><ustkid>..</ustkid>...</kategoriler>...</turkuaz>
 *
 * Bilerek regex tabanlı: besleme düz, öznitelik ve iç içe eleman içermeyen sabit bir
 * yapıda; tam XML kütüphanesi eklemek (yeni bağımlılık + prod imajı) bu iş için fazla.
 * Yapı değişirse ayrıştırıcı 0 kayıt döner ve senkron "besleme boş" diye durur —
 * sessizce yanlış veri yazmaz (aşağıdaki uzunluk kontrolü).
 */

export interface TurkuazSku {
  uid: string;
  kid: string;
  kategori: string;
  isim: string;
  baslik: string;
  aciklama: string;
  kod: string;
  kodgrup: string;
  renk: string;
  ebat: string;
  imalat: boolean;
  /// Tedarikçideki toplam stok (toplamstok alanı).
  stok: number;
  durum: boolean;
  /// Tedarikçi liste fiyatı (adet başına). 0 = fiyatsız kayıt, senkron dışı tutulur.
  fiyat: number;
  /// KDV yüzdesi (20 veya 10).
  kdv: number;
  resimler: string[];
}

export interface TurkuazKategori {
  kid: string;
  ustkid: string;
  isim: string;
  durum: boolean;
}

function bloklar(xml: string, tag: string): string[] {
  const re = new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, "g");
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml))) out.push(m[1]);
  return out;
}

function alan(blok: string, tag: string): string {
  const m = blok.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return m ? xmlCoz(m[1].trim()) : "";
}

/** Beslemede rastlanan temel XML kaçışlarını çözer (CDATA kullanılmıyor). */
function xmlCoz(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&amp;/g, "&");
}

export function urunleriAyristir(xml: string): TurkuazSku[] {
  return bloklar(xml, "urunler").map((b) => {
    const resimler = ["resim1", "resim2", "resim3", "kodgrupResim"]
      .map((t) => alan(b, t))
      .filter((u) => u.startsWith("http"));
    const kod = alan(b, "kod");
    return {
      uid: alan(b, "uid"),
      kid: alan(b, "kid"),
      kategori: alan(b, "kategori"),
      isim: alan(b, "isim"),
      baslik: alan(b, "baslik"),
      aciklama: alan(b, "aciklama"),
      kod,
      // Bazı kayıtlarda kodgrup boş — o durumda SKU kodu tek başına bir gruptur.
      kodgrup: alan(b, "kodgrup") || kod,
      renk: alan(b, "renk"),
      ebat: alan(b, "ebat"),
      imalat: alan(b, "imalat") === "1",
      stok: Math.max(0, parseInt(alan(b, "toplamstok") || "0", 10) || 0),
      durum: alan(b, "durum") === "1",
      fiyat: parseFloat(alan(b, "fiyat") || "0") || 0,
      kdv: parseFloat(alan(b, "kdv") || "20") || 20,
      resimler: [...new Set(resimler)],
    };
  });
}

export function kategorileriAyristir(xml: string): TurkuazKategori[] {
  return bloklar(xml, "kategoriler").map((b) => ({
    kid: alan(b, "kid"),
    ustkid: alan(b, "ustkid"),
    isim: alan(b, "isim"),
    durum: alan(b, "durum") === "1",
  }));
}

/**
 * Bir alt kategorinin KÖK kategorisini bulur (kid → ustkid zinciri, ustkid "0" = kök).
 * Döngü koruması: zincir 20 adımı aşarsa null (bozuk veri).
 */
export function kokKategori(
  kid: string,
  kategoriler: ReadonlyArray<TurkuazKategori>,
): TurkuazKategori | null {
  const byKid = new Map(kategoriler.map((k) => [k.kid, k]));
  let cur = byKid.get(kid) ?? null;
  for (let i = 0; cur && i < 20; i++) {
    if (cur.ustkid === "0") return cur;
    cur = byKid.get(cur.ustkid) ?? null;
  }
  return null;
}
