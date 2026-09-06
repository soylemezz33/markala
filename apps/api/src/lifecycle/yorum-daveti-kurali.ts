/**
 * YORUM DAVETİ: MÜŞTERİ BAŞINA TEK İSTEK (2026-09-06)
 *
 * Hasan: "aynı müşteriye sanki defalarca e-posta gidiyor."
 * İnceleme sonucu: sistem aynı e-postayı iki kez GÖNDERMİYOR — müşterinin BİRDEN FAZLA
 * SİPARİŞİ vardı ve her sipariş kendi davetini üretti. 19 dakika arayla iki sipariş veren
 * müşteri, 24 saat sonra saniyeler arayla iki "deneyiminizi paylaşır mısınız?" maili aldı.
 * Alıcı tarafında bu, mükerrer gönderimden ayırt edilemez.
 *
 * Kural: bir e-posta adresine YORUM_SESSIZLIK_GUN içinde en fazla bir yorum daveti gider.
 * Aynı turda birden çok siparişi uygun olan müşteride yalnız en eski teslimat davet alır;
 * diğerleri "susturuldu" sayılır. Bir müşteriden iki ayrı yorum istemek zaten yorum sayısını
 * artırmıyor, yalnız gürültü üretiyor.
 */

/** Bir alıcıya iki yorum daveti arasında geçmesi gereken en az gün sayısı. */
export const YORUM_SESSIZLIK_GUN = 14;

export type YorumAdayi = { id: string; email: string | null };

export type YorumKarari = {
  id: string;
  email: string;
  /** true → davet gönderilecek; false → susturulacak (ama bir daha aday olmayacak). */
  gonder: boolean;
};

/**
 * Saf karar. `sonDavet`: alıcı e-postası → daha önce GERÇEKTEN gönderilmiş son davetin anı.
 * Adaylar teslim tarihine göre sıralı gelmeli (en eski önce) — böylece bir müşterinin en eski
 * teslimatı daveti alır, sonrakiler susar.
 *
 * E-postası olmayan aday listeden düşer; e-posta karşılaştırması küçük harfe indirgenir
 * (aynı kişi "Ali@x.com" ve "ali@x.com" ile iki sipariş verebiliyor).
 */
export function yorumDavetiKararlari(
  adaylar: YorumAdayi[],
  sonDavet: Map<string, Date>,
  simdi: Date,
): YorumKarari[] {
  const sessizlikMs = YORUM_SESSIZLIK_GUN * 24 * 60 * 60 * 1000;
  // Tur içinde gönderilenler de sessizliğe dahil: aynı koşuda ikinci davet çıkmasın.
  const enSonGorulen = new Map(sonDavet);
  const kararlar: YorumKarari[] = [];

  for (const aday of adaylar) {
    const email = aday.email?.trim();
    if (!email) continue;
    const anahtar = email.toLowerCase();

    const oncekiDavet = enSonGorulen.get(anahtar);
    const susturulsun =
      oncekiDavet !== undefined && simdi.getTime() - oncekiDavet.getTime() < sessizlikMs;

    kararlar.push({ id: aday.id, email, gonder: !susturulsun });
    if (!susturulsun) enSonGorulen.set(anahtar, simdi);
  }

  return kararlar;
}
