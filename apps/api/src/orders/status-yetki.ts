/**
 * Durum geçişi rol yetkisi (2026-09-03, Hasan).
 *
 * ORDERS_STATUS olan roller (admin, tasarımcı) tam durum makinesini kullanır. Olmayan rol
 * (kargo) yalnız üretim/kargo işini yürütür: "Tasarım Onaylandı" siparişi ÜRETİME alır ve
 * üretimi bitince KARGOYA verir. Eskiden kargo yalnız "kargoya-verildi"ye çekebiliyordu; ama
 * atölyede üretimi de aynı kişi yaptığı için "uretimde" geçişi de açıldı.
 *
 * Saf fonksiyon — controller ve panel aynı kuralı paylaşır; spec doğrudan test eder.
 */
export const KARGO_ROLU_GECISLERI = ["uretimde", "kargoya-verildi"] as const;

export function izinliDurumGecisi(input: { tamYetki: boolean; status: string }): boolean {
  if (input.tamYetki) return true;
  return (KARGO_ROLU_GECISLERI as readonly string[]).includes(input.status);
}
