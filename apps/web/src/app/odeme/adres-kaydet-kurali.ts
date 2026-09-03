/**
 * "Bu adresi bir sonraki siparişim için kaydet" sorusu ne zaman gösterilir?
 *
 * Koşullu görünen her arayüz parçasının kuralı saf fonksiyona çıkarılır ve
 * testle çakılır — ödeme sayfasının içinde satır arası bir koşul olarak
 * bırakılırsa yanlış durumda göründüğü fark edilmez.
 */

export type AdresBenzeri = {
  city: string;
  district: string;
  fullAddress: string;
};

/** Boşluk/büyük-küçük harf farkı iki adresi "farklı" göstermesin. */
export function sadelestir(v: string): string {
  return v.trim().toLocaleLowerCase("tr").replace(/\s+/g, " ");
}

export function ayniAdresMi(a: AdresBenzeri, b: AdresBenzeri): boolean {
  return (
    sadelestir(a.city) === sadelestir(b.city) &&
    sadelestir(a.district) === sadelestir(b.district) &&
    sadelestir(a.fullAddress) === sadelestir(b.fullAddress)
  );
}

export function adresKaydiSorulsunMu(girdi: {
  /** Girişli kullanıcı yoksa kaydedilecek bir hesap da yok. */
  girisYapildi: boolean;
  form: AdresBenzeri;
  kayitliAdresler: AdresBenzeri[];
}): boolean {
  const { girisYapildi, form, kayitliAdresler } = girdi;
  if (!girisYapildi) return false;
  // Adres alanları anlamlı doldurulmadan sormak erken.
  if (form.city.trim() === "") return false;
  if (form.fullAddress.trim().length < 8) return false;
  // Zaten kayıtlıysa sormak, her siparişte aynı adresin kopyasını üretirdi.
  if (kayitliAdresler.some((a) => ayniAdresMi(a, form))) return false;
  return true;
}
