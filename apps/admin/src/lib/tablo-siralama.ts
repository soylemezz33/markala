/**
 * TABLO SIRALAMA / ARAMA ÇEKİRDEĞİ — saf fonksiyonlar (2026-10-08).
 *
 * Neden ayrı dosya: panelde 20'den fazla tablo var ve her biri kendi sıralama/arama
 * mantığını ayrı yazdıkça davranış ayrışıyordu (bazısı Türkçe harfleri yanlış sıralıyor,
 * bazısında arama "Ürün" yazmadan bulamıyor). Buradaki fonksiyonlar React'ten bağımsız
 * olduğu için `vitest` (environment: node, yalnız .ts dosyalarını alır) ile test edilebilir;
 * React tarafı `components/data-table.tsx` içinde bunları kullanır.
 */

export type SortDir = "asc" | "desc";

/** Sıralanabilir hücre değeri. null/undefined = "değer yok" → yöne bakmadan SONA gider. */
export type SortValue = string | number | boolean | Date | null | undefined;

/** Kolon anahtarı → satırdan değer çıkaran fonksiyon. */
export type SortAccessors<T, K extends string> = Record<K, (row: T) => SortValue>;

/**
 * Türkçe harf katlaması — arama için. "Ürün" ↔ "urun", "İŞ" ↔ "is" eşleşsin diye.
 * `toLocaleLowerCase("tr-TR")` tek başına yetmez: kullanıcı aksansız yazdığında
 * ("urun") aksanlı metni ("ürün") bulamaz. Bu yüzden küçültme + harf eşleme birlikte.
 */
export function katla(s: unknown): string {
  return String(s ?? "")
    .toLocaleLowerCase("tr-TR")
    .replace(/[ıİi]/g, "i")
    .replace(/[şŞ]/g, "s")
    .replace(/[ğĞ]/g, "g")
    .replace(/[üÜ]/g, "u")
    .replace(/[öÖ]/g, "o")
    .replace(/[çÇ]/g, "c")
    .replace(/[âÂ]/g, "a")
    .replace(/[îÎ]/g, "i")
    .replace(/[ûÛ]/g, "u")
    .trim();
}

/**
 * Serbest metin araması: sorgu KELİMELERİNİN HEPSİ alanlardan birinde geçmeli (AND).
 * "kırmızı bayrak" yazınca sırası önemsiz; boş sorgu her satırı geçirir.
 */
export function aramaEslesir(sorgu: string, ...alanlar: unknown[]): boolean {
  const kelimeler = katla(sorgu).split(/\s+/).filter(Boolean);
  if (kelimeler.length === 0) return true;
  const havuz = alanlar.map(katla).join(" ");
  return kelimeler.every((k) => havuz.includes(k));
}

const trCollator = new Intl.Collator("tr-TR", { numeric: true, sensitivity: "base" });

/** İki hücre değerini karşılaştırır. Boş değerler DAİMA sona (yön ne olursa olsun). */
export function karsilastir(a: SortValue, b: SortValue, dir: SortDir): number {
  const aBos = a === null || a === undefined || a === "";
  const bBos = b === null || b === undefined || b === "";
  if (aBos && bBos) return 0;
  if (aBos) return 1;
  if (bBos) return -1;

  const yon = dir === "asc" ? 1 : -1;
  if (a instanceof Date || b instanceof Date) {
    const av = a instanceof Date ? a.getTime() : Number(a);
    const bv = b instanceof Date ? b.getTime() : Number(b);
    return (av - bv) * yon;
  }
  if (typeof a === "boolean" || typeof b === "boolean") {
    return (Number(a) - Number(b)) * yon;
  }
  if (typeof a === "number" && typeof b === "number") {
    return (a - b) * yon;
  }
  // Sayı gibi duran metinler (API'den gelen Decimal string'leri) sayısal karşılaştırılır —
  // aksi halde "1000" < "9" gibi saçma sıralama çıkıyordu.
  const an = typeof a === "number" ? a : Number(String(a).replace(",", "."));
  const bn = typeof b === "number" ? b : Number(String(b).replace(",", "."));
  if (Number.isFinite(an) && Number.isFinite(bn)) return (an - bn) * yon;

  return trCollator.compare(String(a), String(b)) * yon;
}

/**
 * Satırları verilen kolona göre sıralar. KARARLI (stable): eşit değerlerde girdi sırası
 * korunur, böylece ikinci kez sıralamak listeyi rastgele karıştırmaz.
 * Girdi dizisi DEĞİŞTİRİLMEZ (kopya döner).
 */
export function siralaSatirlar<T, K extends string>(
  rows: T[],
  accessors: SortAccessors<T, K>,
  key: K,
  dir: SortDir,
): T[] {
  const al = accessors[key];
  if (typeof al !== "function") return rows.slice();
  return rows
    .map((row, i) => ({ row, i, v: al(row) }))
    .sort((x, y) => karsilastir(x.v, y.v, dir) || x.i - y.i)
    .map((x) => x.row);
}

/**
 * Bir kolona İLK tıklandığında hangi yön gelmeli?
 * Metin kolonunda A→Z (asc) beklenir; sayı ve tarihte "en büyük/en yeni önce" (desc)
 * beklenir — ciro veya tarih kolonuna tıklayan kimse en küçükten başlamasını istemez.
 */
export function ilkYon(ornekDeger: SortValue): SortDir {
  if (ornekDeger instanceof Date) return "desc";
  if (typeof ornekDeger === "number" || typeof ornekDeger === "boolean") return "desc";
  if (typeof ornekDeger === "string" && ornekDeger !== "" && Number.isFinite(Number(ornekDeger))) {
    return "desc";
  }
  return "asc";
}

/** Aynı kolona tekrar tıklanınca yön döner; başka kolona geçilince o kolonun ilk yönü. */
export function sonrakiSira<T, K extends string>(
  mevcut: { key: K; dir: SortDir },
  hedef: K,
  rows: T[],
  accessors: SortAccessors<T, K>,
): { key: K; dir: SortDir } {
  if (mevcut.key === hedef) {
    return { key: hedef, dir: mevcut.dir === "asc" ? "desc" : "asc" };
  }
  const al = accessors[hedef];
  const ornek = rows.map((r) => al?.(r)).find((v) => v !== null && v !== undefined && v !== "");
  return { key: hedef, dir: ilkYon(ornek) };
}
