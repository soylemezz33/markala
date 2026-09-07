import type { Metadata } from "next";
import { SistemSagligiClient } from "./sistem-sagligi-client";

export const metadata: Metadata = { title: "Sistem Sağlığı" };

/**
 * Sistem Sağlığı (2026-09-07, 7 Eylül kesintisinden sonra).
 *
 * Sayfa BİLEREK sunucuda veri çekmiyor: rapor istemciden /api/sistem-sagligi ile alınır ve
 * periyodik yenilenir. Sunucuda çekilseydi API çöktüğünde sayfanın kendisi hata verirdi —
 * kesintiyi göstermesi gereken araç tam da kesintide kullanılamaz olurdu.
 */
export default function SistemSagligiPage() {
  return <SistemSagligiClient />;
}
