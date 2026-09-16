/**
 * iyzico ERİŞİM DURUMU — süreç içi sayaç (2026-09-16, Hasan: "bunu da sağlık tarafına ekleyelim").
 *
 * 16 Eyl 08:58-10:15: sunucudan iyzico'ya TLS bağlantısı kurulamadı (ECONNRESET / "socket
 * disconnected before secure TLS connection"), diğer dış servisler sağlamdı; bir müşteri kartla
 * ödeyemeyip havaleye geçti. Kesinti müşteriden öğrenildi → sağlık sayfasına ödeme sağlayıcı bloğu.
 *
 * IyzicoService her çağrıda buraya yazar: AĞ hatası (SDK err) → agHatasiKaydet; iyzico yanıt
 * verdiyse (status success/failure fark etmez, erişim VAR) → basariKaydet. Sağlık raporu bunları
 * canlı bağlantı testiyle birlikte gösterir. hata-sayaci.ts ile aynı desen: bellek içi, 1 saat pencere.
 */
const PENCERE_MS = 60 * 60 * 1000;
const TAVAN = 300;

let sonBasari: number | null = null;
let sonHata: number | null = null;
let sonHataMesaji: string | null = null;
let ardArdaHata = 0;
const hatalar: number[] = [];

export function agHatasiKaydet(mesaj: string, simdi = Date.now()): void {
  sonHata = simdi;
  sonHataMesaji = mesaj.slice(0, 200);
  ardArdaHata += 1;
  hatalar.push(simdi);
  if (hatalar.length > TAVAN) hatalar.splice(0, hatalar.length - TAVAN);
}

export function basariKaydet(simdi = Date.now()): void {
  sonBasari = simdi;
  ardArdaHata = 0;
}

export type IyzicoDurumu = {
  sonBasari: string | null;
  sonHata: string | null;
  sonHataMesaji: string | null;
  ardArdaHata: number;
  son5dkHata: number;
  son1saatHata: number;
};

export function iyzicoDurumu(simdi = Date.now()): IyzicoDurumu {
  const sinir = simdi - PENCERE_MS;
  const besDk = simdi - 5 * 60 * 1000;
  while (hatalar.length && hatalar[0] < sinir) hatalar.shift();
  return {
    sonBasari: sonBasari ? new Date(sonBasari).toISOString() : null,
    sonHata: sonHata ? new Date(sonHata).toISOString() : null,
    sonHataMesaji,
    ardArdaHata,
    son5dkHata: hatalar.filter((t) => t >= besDk).length,
    son1saatHata: hatalar.length,
  };
}

/** Testler için. */
export function iyzicoDurumSifirla(): void {
  sonBasari = null; sonHata = null; sonHataMesaji = null; ardArdaHata = 0; hatalar.length = 0;
}
