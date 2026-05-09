import { AdminPlaceholder } from "@/components/admin-placeholder";
import { ChatCircle } from "@phosphor-icons/react/dist/ssr";

export default function YorumlarPage() {
  return (
    <AdminPlaceholder
      title="Yorumlar"
      desc="Müşteri yorumları, ürün puanları, moderasyon ve yanıt yönetimi"
      icon={ChatCircle}
      table={{
        columns: ["Müşteri", "Ürün", "Puan", "Yorum", "Tarih", "Durum"],
        rows: [
          { Müşteri: "Ali Y.", Ürün: "Klasik Kartvizit · CYP", Puan: "★★★★★", Yorum: "Hızlı teslimat, kalite mükemmel", Tarih: "06.05.2026", Durum: "Onay Bekliyor" },
          { Müşteri: "Mehmet K.", Ürün: "Vinil Branda 440 gr", Puan: "★★★★☆", Yorum: "Renk biraz farklı çıktı ama kalite iyi", Tarih: "05.05.2026", Durum: "Onaylı" },
          { Müşteri: "Zeynep A.", Ürün: "Selefonlu Broşür", Puan: "★★★★★", Yorum: "Restoranımız için harika oldu", Tarih: "04.05.2026", Durum: "Onaylı" },
        ],
      }}
      features={[
        "1-5 yıldız puanlama sistemi",
        "Manuel onay (spam filtrelemesi)",
        "Admin yanıtı ekleyebilme",
        "Doğrulanmış alıcı rozeti (sipariş geçmişi kontrolü)",
        "Yorumun ürün sayfasında gösterimi",
        "Schema.org Review markup ile rich snippet",
      ]}
      endpoints={[
        { method: "GET", path: "/api/reviews?status=pending", desc: "Onay bekleyen yorumlar" },
        { method: "POST", path: "/api/reviews", desc: "Yeni yorum (kullanıcı tarafı)" },
        { method: "PATCH", path: "/api/reviews/:id/approve", desc: "Yorumu onayla" },
        { method: "POST", path: "/api/reviews/:id/reply", desc: "Admin yanıtı ekle" },
      ]}
    />
  );
}
