import PaketlerClient from "./paketler-client";

/**
 * /kampanyalar — tüm paketler. Metadata layout.tsx'ten gelir (bu rotanın varsayılanı).
 * Grup sekmeleri (Esnaf / Seçim) gerçek alt rotalara gider; bkz. paket-gruplari.ts.
 */
export default function KampanyalarPage() {
  return <PaketlerClient grup="tumu" />;
}
