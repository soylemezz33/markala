/**
 * Turkuaz BAYİ BASKI TARİFESİ (2026-09-17) — SAF modül.
 *
 * Kaynak: Gönül Hanım'ın ilettiği "Turkuaz_Promosyon_Baski_Fiyat_Listesi_2026.pdf"
 * (20 sayfa, güncelleme 21.01.2026; sayfa görüntüleri scratchpad'de). Sitedeki herkese
 * açık listeyle birebir aynı çıktı — bayiye özel baskı indirimi YOK ("İskonto uygulanmaz").
 * TÜM TUTARLAR KDV HARİÇ (PDF dipnotu). TEK YÖN / TEK RENK logo baskısı esas alındı;
 * çift yön/renk tarifede ×2'dir ve v1'de sunulmaz (ileride konfigüratör seçeneği olabilir).
 *
 * Kural: bant içinde toplam = sabit + perAdet × adet. (Ajanda gofre gibi "Adet×5 + 1.250"
 * satırları perAdet+sabit; parti ücretli satırlar yalnız sabit.)
 *
 * EŞLEME: ürünün kategori slug'ı + açıklamadaki baskı tekniği + isim ipuçlarıyla ilk
 * eşleşen tarife kullanılır. Eşleşme yoksa null döner — ürün baskı payı almaz ve senkron
 * raporunda listelenir (sessizce yanlış fiyat üretmek YASAK).
 */

export interface TarifeBant {
  min: number;
  max: number; // dahil; son bant için Infinity
  sabit: number;
  perAdet: number;
}

interface Tarife {
  ad: string;
  uygun: (kategoriSlug: string, teknik: string, isim: string) => boolean;
  bantlar: TarifeBant[];
}

const b = (min: number, max: number, sabit: number, perAdet = 0): TarifeBant => ({ min, max, sabit, perAdet });
const iceriyor = (s: string, ...aranan: string[]) => aranan.some((a) => s.includes(a));

/** Sıra önemli: özel eşleşmeler önce, genel kategori tarifeleri sonra. */
const TARIFELER: Tarife[] = [
  // --- KALEM ---
  {
    ad: "metal kalem (lazer)",
    uygun: (k, t, i) => k === "promosyon-kalem" && iceriyor(i, "metal") && iceriyor(t, "lazer"),
    bantlar: [b(1, 100, 500), b(101, 250, 900), b(251, 500, 1250), b(501, Infinity, 0, 1.8)],
  },
  {
    ad: "metal kalem (tampon)",
    uygun: (k, t, i) => k === "promosyon-kalem" && iceriyor(i, "metal"),
    bantlar: [b(1, 1000, 1500), b(1001, Infinity, 0, 1.4)],
  },
  {
    ad: "ikili kalem seti (lazer)",
    uygun: (k, _t, i) => k === "promosyon-kalem" && iceriyor(i, "ikili") && iceriyor(i, "set"),
    bantlar: [b(1, 5, 0, 50), b(6, 10, 0, 45), b(11, 25, 0, 20), b(26, 50, 0, 14), b(51, Infinity, 0, 10)],
  },
  {
    ad: "tekli kalem seti (lazer)",
    uygun: (k, _t, i) => k === "promosyon-kalem" && iceriyor(i, "set"),
    bantlar: [b(1, 5, 0, 35), b(6, 10, 0, 25), b(11, 25, 0, 16), b(26, 50, 0, 10), b(51, Infinity, 0, 6)],
  },
  {
    ad: "fosforlu kalem (uv renkli)",
    uygun: (k, _t, i) => k === "promosyon-kalem" && iceriyor(i, "fosforlu"),
    bantlar: [b(1, 50, 700), b(51, 100, 1000), b(101, 250, 1500), b(251, Infinity, 0, 5)],
  },
  {
    ad: "plastik/kurşun/tohumlu kalem (tampon tek yön)",
    uygun: (k) => k === "promosyon-kalem",
    bantlar: [b(1, 300, 900), b(301, 500, 1100), b(501, 1000, 1200), b(1001, Infinity, 0, 1.2)],
  },

  // --- ÇAKMAK ---
  {
    ad: "metal çakmak (lazer)",
    uygun: (k, t, i) => k === "promosyon-cakmak" && (iceriyor(i, "metal") || iceriyor(t, "lazer")),
    bantlar: [b(1, 25, 750), b(26, 50, 1400), b(51, Infinity, 0, 26)],
  },
  {
    ad: "çakmak 15010/15040 (tampon)",
    uygun: (k, _t, i) => k === "promosyon-cakmak" && iceriyor(i, "15010", "15040"),
    bantlar: [b(1, 1000, 1500), b(1001, Infinity, 0, 1.4)],
  },
  {
    ad: "çakmak (tampon tek renk)",
    uygun: (k) => k === "promosyon-cakmak",
    bantlar: [b(1, 250, 900), b(251, 500, 1100), b(501, 1000, 1200), b(1001, Infinity, 0, 1.2)],
  },

  // --- ANAHTARLIK / ROZET ---
  {
    ad: "anahtarlık (domeks)",
    uygun: (k, t) => k === "promosyon-anahtarlik" && iceriyor(t, "domeks"),
    bantlar: [b(1, 100, 1000), b(101, 250, 1750), b(251, Infinity, 0, 6.8)],
  },
  {
    ad: "anahtarlık/rozet (lazer)",
    uygun: (k) => k === "promosyon-anahtarlik",
    bantlar: [b(1, 100, 700), b(101, 250, 1200), b(251, 500, 1500), b(501, Infinity, 0, 2.75)],
  },

  // --- TEKSTİL ---
  {
    ad: "şapka (dtf)",
    uygun: (k, _t, i) => k === "promosyon-tekstil" && iceriyor(i, "şapka", "sapka"),
    bantlar: [b(1, 50, 0, 12), b(51, 100, 0, 8.5), b(101, Infinity, 0, 5)],
  },
  {
    ad: "tişört (dtf ön göğüs)",
    uygun: (k, _t, i) => k === "promosyon-tekstil" && iceriyor(i, "tişört", "tisort", "t-shirt"),
    bantlar: [b(1, 50, 0, 18), b(51, Infinity, 0, 15)],
  },
  {
    ad: "tekstil genel (serigraf tek renk)",
    uygun: (k) => k === "promosyon-tekstil",
    bantlar: [b(1, 100, 1500), b(101, 200, 2000), b(201, 300, 2500), b(301, 400, 3000), b(401, 500, 3500), b(501, Infinity, 0, 6)],
  },

  // --- ÇANTA / SEKRETERLİK ---
  {
    ad: "sekreterlik (uv renkli)",
    uygun: (k, _t, i) => k === "promosyon-canta" && iceriyor(i, "sekreterlik"),
    bantlar: [b(1, 50, 1200), b(51, 100, 2100), b(101, Infinity, 0, 20)],
  },
  {
    ad: "organizer (gofre)",
    uygun: (k, t, i) => k === "promosyon-canta" && (iceriyor(i, "organizer") || iceriyor(t, "gofre")),
    bantlar: [b(1, 50, 2000), b(51, 100, 3000), b(101, 250, 1150, 10), b(251, Infinity, 1150, 9)],
  },
  {
    ad: "bez/tela çanta (serigraf tek renk)",
    uygun: (k) => k === "promosyon-canta",
    bantlar: [b(1, 100, 1500), b(101, 200, 2000), b(201, 300, 2500), b(301, 400, 3000), b(401, 500, 3500), b(501, Infinity, 0, 6)],
  },

  // --- AJANDA / DEFTER ---
  {
    ad: "ajanda-defter (uv renkli)",
    uygun: (k, t) => k === "promosyon-defter-ajanda" && iceriyor(t, "uv") && !iceriyor(t, "gofre"),
    bantlar: [b(1, 50, 950), b(51, 100, 1800), b(101, 250, 0, 16), b(251, Infinity, 0, 13)],
  },
  {
    ad: "ajanda-defter (gofre-frekans)",
    uygun: (k) => k === "promosyon-defter-ajanda",
    bantlar: [b(1, 50, 1500), b(51, 100, 1750), b(101, 250, 1250, 5), b(251, 500, 1250, 4.5), b(501, Infinity, 1250, 4)],
  },

  // --- SAAT ---
  {
    ad: "duvar/masa saati (kadran dijital baskı)",
    // PDF notu: 32 cm'yi geçmeyen kadranlarda dijital baskı birim 30 ₺ (kadran özel üretilir).
    uygun: (k) => k === "promosyon-saat",
    bantlar: [b(1, Infinity, 0, 30)],
  },

  // --- TEKNOLOJİ ---
  {
    ad: "kristal usb (patlatma lazer)",
    uygun: (k, _t, i) => k === "promosyon-teknoloji" && iceriyor(i, "kristal"),
    bantlar: [b(1, 50, 0, 55), b(51, 100, 0, 50), b(101, Infinity, 0, 45)],
  },
  {
    ad: "usb bellek (lazer)",
    uygun: (k, _t, i) => k === "promosyon-teknoloji" && iceriyor(i, "usb", "bellek"),
    bantlar: [b(1, 50, 550), b(51, 100, 1000), b(101, Infinity, 0, 9)],
  },
  {
    ad: "powerbank/teknoloji (lazer)",
    uygun: (k) => k === "promosyon-teknoloji",
    bantlar: [b(1, 50, 850), b(51, 100, 1500), b(101, Infinity, 0, 14)],
  },

  // --- TERMOS / BARDAK ---
  {
    ad: "cam matara kılıf (dtf)",
    uygun: (k, t) => k === "promosyon-bardak-termos" && iceriyor(t, "dtf", "transfer"),
    bantlar: [b(1, 50, 1000), b(51, 100, 1750), b(101, Infinity, 0, 17)],
  },
  {
    ad: "termos/matara (lazer)",
    uygun: (k, t) => k === "promosyon-bardak-termos" && iceriyor(t, "lazer"),
    bantlar: [b(1, 50, 1000), b(51, 100, 1800), b(101, Infinity, 0, 15)],
  },
  {
    ad: "termos/matara (uv)",
    uygun: (k) => k === "promosyon-bardak-termos",
    bantlar: [b(1, 50, 1250), b(51, 100, 2500), b(101, Infinity, 0, 23)],
  },

  // --- VIP SET ---
  {
    ad: "vip set (kutu üzerine firma baskı)",
    uygun: (k) => k === "promosyon-vip-set",
    bantlar: [b(1, 5, 0, 110), b(6, 10, 0, 105), b(11, 20, 0, 95), b(21, Infinity, 0, 85)],
  },

  // --- ÇEŞİTLİ (masaüstü, kartvizitlik, ayna, hesap makinesi, fener, takvim...) ---
  {
    ad: "masa sümen takımı (tek parça)",
    uygun: (k, _t, i) => k === "promosyon-cesitli" && iceriyor(i, "sümen", "sumen"),
    bantlar: [b(1, 5, 0, 185), b(6, 10, 0, 150), b(11, 20, 0, 140), b(21, Infinity, 0, 115)],
  },
  {
    ad: "kartvizitlik (logo lazer)",
    uygun: (k, _t, i) => k === "promosyon-cesitli" && iceriyor(i, "kartvizitlik"),
    bantlar: [b(1, 10, 275), b(11, 25, 350), b(26, 50, 450), b(51, 100, 550), b(101, Infinity, 0, 5.5)],
  },
  {
    ad: "ayna (lazer)",
    uygun: (k, _t, i) => k === "promosyon-cesitli" && iceriyor(i, "ayna"),
    bantlar: [b(1, 50, 750), b(51, 100, 1200), b(101, Infinity, 0, 11)],
  },
  {
    ad: "hesap makinesi (uv)",
    uygun: (k, _t, i) => k === "promosyon-cesitli" && iceriyor(i, "hesap makin"),
    bantlar: [b(1, 50, 1200), b(51, 100, 1800), b(101, Infinity, 0, 16)],
  },
  {
    ad: "fener/çakı (lazer)",
    uygun: (k, _t, i) => k === "promosyon-cesitli" && iceriyor(i, "fener", "çakı", "caki"),
    bantlar: [b(1, 25, 275), b(26, 50, 450), b(51, Infinity, 0, 5.5)],
  },
  {
    ad: "kapak açacak / ahşap tutucu (uv)",
    uygun: (k, _t, i) => k === "promosyon-cesitli" && iceriyor(i, "açacak", "acacak", "tutucu"),
    bantlar: [b(1, 50, 500), b(51, 100, 900), b(101, Infinity, 0, 5)],
  },
  {
    ad: "not tutucu / kamera kapatıcı (tampon-uv)",
    uygun: (k, _t, i) => k === "promosyon-cesitli" && iceriyor(i, "not tutucu", "kamera"),
    bantlar: [b(1, 100, 1200), b(101, 250, 1600), b(251, Infinity, 0, 6)],
  },
  {
    ad: "gemici takvimi (reklam alanı ofset + selefon)",
    uygun: (k, _t, i) => k === "promosyon-cesitli" && iceriyor(i, "takvim"),
    bantlar: [b(1, 500, 3400), b(501, 1000, 2500, 1.75), b(1001, Infinity, 2500, 1.75)],
  },
  {
    ad: "şemsiye (dtf tek panel)",
    uygun: (_k, _t, i) => iceriyor(i, "şemsiye", "semsiye"),
    bantlar: [b(1, 50, 0, 40), b(51, 100, 0, 37), b(101, Infinity, 0, 35)],
  },
  {
    ad: "silgi (uv)",
    uygun: (k, _t, i) => k === "promosyon-cesitli" && iceriyor(i, "silgi"),
    bantlar: [b(1, 500, 1400), b(501, 1000, 2300), b(1001, Infinity, 0, 2.2)],
  },
  {
    ad: "postit/geri dönüşümlü (uv renkli)",
    uygun: (k, _t, i) =>
      k === "promosyon-cesitli" && iceriyor(i, "postit", "post-it", "notluk", "küp blok", "kup blok"),
    bantlar: [b(1, 50, 1000), b(51, 100, 1850), b(101, Infinity, 0, 18)],
  },
  {
    ad: "çeşitli genel (serigraf tek renk)",
    // Son çare: masaüstü/plaket benzeri kalanlar serigraf genel listesine düşer.
    uygun: (k) => k === "promosyon-cesitli",
    bantlar: [b(1, 100, 1500), b(101, 200, 2000), b(201, 300, 2500), b(301, 400, 3000), b(401, 500, 3500), b(501, Infinity, 0, 6)],
  },
];

export interface BaskiSonuc {
  tarife: string;
  /** Verilen adet için TOPLAM baskı ücreti (KDV hariç, tek yön/tek renk logo). */
  toplam: number;
}

export function baskiUcreti(
  kategoriSlug: string,
  baskiTeknigi: string | undefined,
  isim: string,
  adet: number,
): BaskiSonuc | null {
  const k = kategoriSlug;
  const t = (baskiTeknigi ?? "").toLocaleLowerCase("tr");
  const i = isim.toLocaleLowerCase("tr");
  for (const tarife of TARIFELER) {
    if (!tarife.uygun(k, t, i)) continue;
    const bant = tarife.bantlar.find((x) => adet >= x.min && adet <= x.max);
    if (!bant) return null;
    return { tarife: tarife.ad, toplam: Math.round((bant.sabit + bant.perAdet * adet) * 100) / 100 };
  }
  return null;
}
