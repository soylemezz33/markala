export const VAT_RATE = 0.2;

/** KDV-dahil tutardan KDV'yi çıkarır (KDV hariç gösterim). */
export function exVat(gross: number): number {
  return Math.round((gross / (1 + VAT_RATE)) * 100) / 100;
}
