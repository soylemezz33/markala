/**
 * MANUEL SİPARİŞ — saf kurallar (2026-09-16, Hasan: "yüz yüze iş aldık, havale ile ödendi;
 * panelde manuel sipariş ekle butonu olsun, ciroya dahil olsun, işleri takip edelim").
 *
 * Fiyatlar KDV DAHİL girilir (sitedeki gibi); KDV ters hesapla ayrıştırılır. Kargo KDV dışı
 * eklenir — orders.service.create ile aynı formül (VAT_DIVISOR 1.2).
 */
export const MANUEL_ODEME_YONTEMLERI = ["havale", "nakit", "pos"] as const;
export type ManuelOdemeYontemi = (typeof MANUEL_ODEME_YONTEMLERI)[number];
export const MANUEL_KANALLAR = ["yuz-yuze", "telefon", "whatsapp", "diger"] as const;
export type ManuelKanal = (typeof MANUEL_KANALLAR)[number];
/** Yüz yüze tahsilat: e-Arşiv'de "internet satışı" bloğu GÖNDERİLMEZ (bkz. parasut-kural). */
export const YUZ_YUZE_ODEME: readonly string[] = ["nakit", "pos"];

const VAT_DIVISOR = 1.2;
const round2 = (n: number) => Math.round(n * 100) / 100;

export interface ManuelKalemGirdisi {
  quantity: number;
  unitPrice: number; // KDV dahil birim fiyat
}

export interface ManuelHesap {
  satirlar: number[]; // her kalemin lineTotal'ı (KDV dahil)
  subtotal: number;
  discount: number;
  shippingFee: number;
  vat: number;
  total: number;
}

export function manuelSiparisHesapla(kalemler: ManuelKalemGirdisi[], indirim = 0, kargo = 0): ManuelHesap {
  const satirlar = kalemler.map((k) => round2(Math.max(0, k.unitPrice) * Math.max(0, Math.floor(k.quantity))));
  const subtotal = round2(satirlar.reduce((s, x) => s + x, 0));
  const discount = round2(Math.min(Math.max(0, indirim), subtotal));
  const shippingFee = round2(Math.max(0, kargo));
  const taxableGross = round2(subtotal - discount);
  const netBeforeVat = round2(taxableGross / VAT_DIVISOR);
  const vat = round2(taxableGross - netBeforeVat);
  const total = round2(taxableGross + shippingFee);
  return { satirlar, subtotal, discount, shippingFee, vat, total };
}

export const KANAL_ETIKETI: Record<ManuelKanal, string> = {
  "yuz-yuze": "Yüz yüze",
  telefon: "Telefon",
  whatsapp: "WhatsApp",
  diger: "Diğer",
};
export const ODEME_ETIKETI: Record<ManuelOdemeYontemi, string> = {
  havale: "Havale / EFT",
  nakit: "Nakit",
  pos: "Kart (POS)",
};

/** Order.notes: sistem eki (kanal + kim oluşturdu + ödeme) ve varsa personel notu. */
export function manuelSiparisNotu(kanal: ManuelKanal, yontem: ManuelOdemeYontemi, olusturan: string, odemeAlindi: boolean, ekNot?: string | null): string {
  const bas = `Kanal: ${KANAL_ETIKETI[kanal]} · Manuel sipariş (${olusturan}) · Ödeme: ${ODEME_ETIKETI[yontem]}${odemeAlindi ? " (alındı)" : " (bekliyor)"}`;
  const ek = (ekNot ?? "").trim();
  return ek ? `${bas}\n${ek}` : bas;
}

/** E-postası olmayan müşteri için kendi alanımızda yerel adres: dışarı bounce üretmez, MDaemon anında reddeder. */
export function epostaYerTutucu(telefon: string): string {
  return `yok+${telefon.replace(/\D/g, "") || "bilinmiyor"}@markala.com.tr`;
}
/** Sitedeki buildSelectionSummary'nin sunucu eşi: "en×boy cm · seçenek etiketleri" (grup sırasıyla). */
export function konfigurasyonOzeti(
  options: Array<{ groupKey: string; groupSort: number; optionKey: string; optionLabel: string }>,
  selections: Record<string, string>,
): string {
  const parts: string[] = [];
  if (selections.en && selections.boy) parts.push(`${selections.en}×${selections.boy} cm`);
  const gruplar = new Map<string, number>();
  for (const o of options) if (!gruplar.has(o.groupKey)) gruplar.set(o.groupKey, o.groupSort);
  for (const [groupKey] of [...gruplar.entries()].sort((a, b) => a[1] - b[1])) {
    const sel = selections[groupKey];
    if (!sel) continue;
    const opt = options.find((o) => o.groupKey === groupKey && o.optionKey === sel);
    if (opt) parts.push(opt.optionLabel);
  }
  return parts.join(" · ");
}

export function epostaYerTutucuMu(email: string | null | undefined): boolean {
  return /^yok\+[^@]*@markala\.com\.tr$/i.test(String(email ?? ""));
}
