/**
 * Kampanyalar sayfasının ÜST sekmeleri (2026-10-09, Hasan: "esnaf paketi ve seçim paketi
 * olarak ayıralım, tıklandığında link değişsin çünkü link üzerinden müşteriye göndereceğim").
 *
 * Her sekme GERÇEK bir rota — query parametresi DEĞİL. Sebebi doğrudan bu istek: WhatsApp'tan
 * müşteriye gönderilen link tek başına doğru sekmeyi açmalı, paylaşımda önizleme başlığı da
 * o gruba ait olmalı. Query parametresi olsaydı canonical ve OG etiketleri tek sayfaya
 * düşerdi.
 *
 * Yeni grup eklerken: buraya satır ekle + app/kampanyalar/<yol>/page.tsx aç (üç satırlık
 * sarmalayıcı, metadata'sını kendisi verir).
 */
export type PaketGrupId = "tumu" | "esnaf" | "secim";

export interface PaketGrubu {
  id: PaketGrupId;
  /** Sekme etiketi */
  etiket: string;
  /** Rota — mutlak yol */
  yol: string;
  /**
   * Bu gruba hangi paket kategorileri girer; boş dizi = hepsi.
   * Tip BİLEREK `string[]`: kategori değeri API'den düz metin olarak geliyor ve yeni bir
   * kategori eklemek bu dosyayı @markala/types sürümüne bağımlı kılmasın.
   */
  kategoriler: readonly string[];
  baslik: string;
  aciklama: string;
}

export const PAKET_GRUPLARI: PaketGrubu[] = [
  {
    id: "tumu",
    etiket: "Tüm Paketler",
    yol: "/kampanyalar",
    kategoriler: [],
    // Başlık canlı SEO başlığıyla ("İndirimli Paketler") BİLEREK aynı: paketlerin hepsinde
    // gerçek bir indirim var (liste toplamı - %15), dolayısıyla iddia karşılanıyor.
    baslik: "İndirimli Paketler",
    aciklama:
      "Açılış, esnaf, kurumsal, etkinlik ve aday tanıtımı için birden çok ürünü tek pakette topluyoruz, tasarım desteği dahil.",
  },
  {
    id: "esnaf",
    etiket: "Esnaf Paketi",
    yol: "/kampanyalar/esnaf-paketi",
    kategoriler: ["esnaf", "acilis", "kurumsal", "etkinlik", "promosyon"],
    baslik: "Esnaf Paketleri",
    aciklama:
      "Dükkan, ofis ve yeni açılan işletmeler için kartvizit, afiş, tabela ve tanıtım ürünlerini tek pakette topluyoruz.",
  },
  {
    id: "secim",
    etiket: "Seçim Paketi",
    yol: "/kampanyalar/secim-paketi",
    kategoriler: ["secim"],
    baslik: "Seçim Paketleri",
    aciklama:
      "Oda, dernek, kooperatif ve sendika seçimlerine giren adaylar için kartvizitten branda afişe kadar tüm tanıtım malzemesi tek pakette. İhtiyaca göre üç boy: az, orta ve fazla miktar.",
  },
];

/** Varsayılan grup — liste her zaman dolu, ama tip güvenliği için ayrı sabit. */
const VARSAYILAN: PaketGrubu = {
  id: "tumu",
  etiket: "Tüm Paketler",
  yol: "/kampanyalar",
  kategoriler: [],
  baslik: "İndirimli Paketler",
  aciklama:
    "Açılış, esnaf, kurumsal, etkinlik ve aday tanıtımı için birden çok ürünü tek pakette topluyoruz, tasarım desteği dahil.",
};

export function grubuBul(id: PaketGrupId): PaketGrubu {
  return PAKET_GRUPLARI.find((g) => g.id === id) ?? VARSAYILAN;
}
