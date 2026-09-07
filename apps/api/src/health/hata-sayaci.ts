/**
 * SUNUCU HATASI SAYACI (2026-09-07).
 *
 * 7 Eylül sabahı bağlantı havuzu tükendi; ürünler/kategoriler/giriş 45 dakika boyunca 500
 * döndü ve bunu kimse görmedi — panel "Operasyonel" diyordu, kesinti ancak Hasan giriş
 * yapamayınca fark edildi. Sağlık sayfasının "şu an hata alıyor muyuz?" sorusuna cevap
 * verebilmesi için 5xx'leri saymak gerekiyor.
 *
 * BELLEKTE tutulur, diske/DB'ye yazılmaz:
 *  - Hata anı, veritabanına yazmanın en riskli olduğu andır (havuz zaten tükenmişti);
 *    sayaç DB'ye yazsaydı tam da ihtiyaç duyulan anda çalışmazdı.
 *  - Yeniden başlatmada sıfırlanır; bu kabul edilebilir çünkü soru "SON dakikalarda hata
 *    var mı?" — tarihsel arşiv değil.
 *
 * Sabit bir pencere (PENCERE_MS) dışındaki kayıtlar okuma anında düşer, böylece dizi
 * sınırsız büyümez. Ek olarak TAVAN ile sert bir üst sınır var: hata fırtınasında bellek
 * şişmesin (saniyede binlerce 500 gelen bir olayda dizi sonsuza kadar uzardı).
 */

/** Sayacın hatırladığı en uzun süre. Daha eskisi okuma anında atılır. */
const PENCERE_MS = 60 * 60 * 1000; // 1 saat
/** Bellekte tutulan en fazla kayıt (hata fırtınası koruması). */
const TAVAN = 500;

type Kayit = { an: number; yol: string; durum: number; havuzZamanAsimi: boolean };

const kayitlar: Kayit[] = [];

/**
 * Global filtre her 5xx'te çağırır. Asla fırlatmaz — hata yolunda hata üretmek en kötüsü.
 *
 * `havuzZamanAsimi`: Prisma P2024 ("Timed out fetching a new connection from the connection
 * pool"). 7 Eylül kesintisinin İMZASI budur ve doğrudan sayılması şart — açık bağlantı
 * sayısına bakmak yanıltıcı: Prisma havuzunu ısındıkça limite kadar açar ve AÇIK TUTAR,
 * yani "17/17 bağlantı" normal çalışmanın görüntüsüdür, arıza değil. Arızayı ancak bu
 * hatanın kendisi belli eder.
 */
export function sunucuHatasiKaydet(yol: string, durum: number, havuzZamanAsimi = false): void {
  try {
    if (durum < 500) return;
    kayitlar.push({ an: Date.now(), yol: yol.slice(0, 120), durum, havuzZamanAsimi });
    // Baştan atarak tavanı koru (en yeniler kalır).
    if (kayitlar.length > TAVAN) kayitlar.splice(0, kayitlar.length - TAVAN);
  } catch {
    /* sayaç asla akışı bozmaz */
  }
}

export type HataOzeti = {
  son5dk: number;
  son1saat: number;
  /** Son 15 dakikada kaç istek bağlantı havuzu zaman aşımına düştü (Prisma P2024). */
  havuzZamanAsimi15dk: number;
  /** En sık hata veren yollar (en fazla 5) — teşhis buradan başlar. */
  enSikYollar: Array<{ yol: string; adet: number }>;
  sonHataAni: string | null;
};

/** Okuma anında pencereyi uygular ve özet döner. */
export function hataOzeti(simdi = Date.now()): HataOzeti {
  // Pencere dışını kalıcı olarak düş: sayaç zamanla kendini temizlesin.
  const sinir = simdi - PENCERE_MS;
  while (kayitlar.length && kayitlar[0]!.an < sinir) kayitlar.shift();

  const besDk = simdi - 5 * 60 * 1000;
  const onBesDk = simdi - 15 * 60 * 1000;
  const sayim = new Map<string, number>();
  let son5dk = 0;
  let havuzZamanAsimi15dk = 0;
  for (const k of kayitlar) {
    if (k.an >= besDk) son5dk++;
    if (k.havuzZamanAsimi && k.an >= onBesDk) havuzZamanAsimi15dk++;
    sayim.set(k.yol, (sayim.get(k.yol) ?? 0) + 1);
  }

  const enSikYollar = [...sayim.entries()]
    .map(([yol, adet]) => ({ yol, adet }))
    .sort((a, b) => b.adet - a.adet)
    .slice(0, 5);

  return {
    son5dk,
    son1saat: kayitlar.length,
    havuzZamanAsimi15dk,
    enSikYollar,
    sonHataAni: kayitlar.length ? new Date(kayitlar[kayitlar.length - 1]!.an).toISOString() : null,
  };
}

/** Yalnız testler için: sayacı boşaltır. */
export function hataSayaciniSifirla(): void {
  kayitlar.length = 0;
}
