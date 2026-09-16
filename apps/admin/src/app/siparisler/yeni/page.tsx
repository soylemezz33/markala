import { YeniSiparisClient } from "./yeni-siparis-client";

export const dynamic = "force-dynamic";

/**
 * Manuel sipariş (2026-09-16): yüz yüze / telefon / WhatsApp ile alınan işi sisteme kaydeder.
 * Ciroya girer, sipariş akışında (durum, Chatwoot, kargoda fatura) normal sipariş gibi yürür.
 */
export default function YeniSiparisPage() {
  return <YeniSiparisClient />;
}
