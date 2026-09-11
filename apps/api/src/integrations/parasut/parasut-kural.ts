/**
 * Paraşüt e-belge KARARI — saf fonksiyonlar (test edilebilir, ağ yok).
 *
 * Kural (2026-09-11, Hasan: "kargoya verildiğinde otomatik fatura kesilsin"):
 *  - Kurumsal (VKN'li) müşteri VE VKN'si GİB e-Fatura sisteminde kayıtlıysa → e-Fatura (temel senaryo).
 *  - Diğer herkes (bireysel, VKN'siz, e-Fatura mükellefi olmayan şirket) → e-Arşiv.
 *  - İnternet satışı bilgisi e-Arşiv'de zorunlu: ödeme tipi ve platformu sipariş yönteminden türetilir.
 *  - Gönderi bilgisi: kargo firması adı + (biliniyorsa) VKN + kargoya verilme tarihi.
 */
export type EBelgeTuru = "e_invoice" | "e_archive";

export interface EBelgeGirdi {
  kurumsal: boolean;
  vergiNo?: string | null;
  /** GET /e_invoice_inboxes?filter[vkn]= sonucu — bulunan gelen kutusu adresi */
  eFaturaKutusu?: string | null;
  paymentMethod?: string | null; // iyzico | havale | cari
  odemeTarihi: Date;
  kargoFirmasi?: string | null;
  kargoTarihi: Date;
  /** Kargo firması → VKN eşlemesi (env PARASUT_KARGO_VKN JSON) */
  kargoVkn?: Record<string, string>;
}

export interface EBelgeKarari {
  tur: EBelgeTuru;
  /** e_invoices için `to`; e_archives için yok */
  kutu?: string;
  internetSatisi?: {
    url: string;
    payment_type: "KREDIKARTI/BANKAKARTI" | "EFT/HAVALE" | "KAPIDAODEME" | "ODEMEARACISI";
    payment_platform?: string;
    payment_date: string;
  };
  gonderi?: { title: string; vkn?: string; date: string };
}

const gun = (d: Date) => d.toISOString().slice(0, 10);

export function eBelgeKararla(g: EBelgeGirdi): EBelgeKarari {
  const vkn = (g.vergiNo ?? "").replace(/\D/g, "");
  // Gönderi bloğu YALNIZ kargo firmasının VKN'si biliniyorsa gider: Paraşüt, VKN'siz gönderi
  // bloğunu "E-arşiv kurye VKN/TCKN geçersiz" ile reddediyor (11 Eyl canlı test). VKN yoksa blok
  // hiç gönderilmez; belge yine kesilir. VKN env PARASUT_KARGO_VKN'den gelir.
  const kargoVkn = g.kargoFirmasi ? kargoVknBul(g.kargoFirmasi, g.kargoVkn) : undefined;
  const gonderi = g.kargoFirmasi && kargoVkn
    ? { title: g.kargoFirmasi.trim(), vkn: kargoVkn, date: gun(g.kargoTarihi) }
    : undefined;
  if (g.kurumsal && vkn.length === 10 && g.eFaturaKutusu) {
    return { tur: "e_invoice", kutu: g.eFaturaKutusu, gonderi };
  }
  const havale = g.paymentMethod === "havale" || g.paymentMethod === "cari";
  return {
    tur: "e_archive",
    internetSatisi: {
      url: "https://markala.com.tr",
      payment_type: havale ? "EFT/HAVALE" : "KREDIKARTI/BANKAKARTI",
      ...(havale ? {} : { payment_platform: "iyzico" }),
      payment_date: gun(g.odemeTarihi),
    },
    gonderi,
  };
}

/** "DHL eCommerce" → env eşlemesinde anahtar alt dize eşleşmesi (büyük/küçük harf duyarsız), yalnız 10 haneli VKN. */
export function kargoVknBul(firma: string, map?: Record<string, string>): string | undefined {
  if (!map) return undefined;
  const f = firma.toLocaleLowerCase("tr");
  for (const [k, v] of Object.entries(map)) {
    if (f.includes(k.toLocaleLowerCase("tr")) && /^\d{10}$/.test(v)) return v;
  }
  return undefined;
}
