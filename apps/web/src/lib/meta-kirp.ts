/**
 * Meta açıklamasını arama sonucunda düzgün görünecek şekilde kırpar.
 *
 * `metin.slice(0, 160)` kelimeyi ortadan böler; 2026-09-23 canlı taramasında 35 kategori
 * sayfasının açıklaması SERP'te "…2-3 iş günü ür", "…tek adetten sipa" diye bitiyordu.
 * Ürün sayfası bunu zaten kelime sınırında kesiyordu; kural artık tek yerde.
 *
 * Kelime sınırına indirdikten sonra sonda kalan bağlayıcı noktalama da atılır — virgülle
 * biten bir açıklama ("…minimum 5 adet,") cümle yarım kalmış izlenimi verir.
 */
export function metaKirp(metin: string, enFazla: number): string {
  const s = metin.trim();
  if (s.length <= enFazla) return s;
  return s
    .slice(0, enFazla)
    .replace(/\s+\S*$/, "") // son (yarım) kelimeyi at
    .replace(/[\s,;:·—–-]+$/, ""); // sonda kalan bağlayıcı noktalama
}
