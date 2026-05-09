import { AdminPlaceholder } from "@/components/admin-placeholder";
import { Receipt } from "@phosphor-icons/react/dist/ssr";

export default function YasalPage() {
  return (
    <AdminPlaceholder
      title="Yasal Sayfalar"
      desc="KVKK, mesafeli satış, çerez, gizlilik, ön bilgilendirme, kullanım koşulları, iade, kargolama"
      icon={Receipt}
      table={{
        columns: ["Sayfa", "Slug", "Son Güncelleme", "Versiyon", "Durum"],
        rows: [
          { Sayfa: "KVKK Aydınlatma Metni", Slug: "/yasal/kvkk", "Son Güncelleme": "06.05.2026", Versiyon: "v3.1", Durum: "Yayında" },
          { Sayfa: "Mesafeli Satış Sözleşmesi", Slug: "/yasal/mesafeli-satis", "Son Güncelleme": "06.05.2026", Versiyon: "v2.4 (fire notu eklendi)", Durum: "Yayında" },
          { Sayfa: "Ön Bilgilendirme Formu", Slug: "/yasal/on-bilgilendirme", "Son Güncelleme": "06.05.2026", Versiyon: "v1.7", Durum: "Yayında" },
          { Sayfa: "Çerez Politikası", Slug: "/yasal/cerez", "Son Güncelleme": "06.05.2026", Versiyon: "v1.3", Durum: "Yayında" },
          { Sayfa: "Gizlilik İlkesi", Slug: "/yasal/gizlilik", "Son Güncelleme": "06.05.2026", Versiyon: "v2.0", Durum: "Yayında" },
          { Sayfa: "Kullanım Koşulları", Slug: "/yasal/kullanim-kosullari", "Son Güncelleme": "06.05.2026", Versiyon: "v1.5", Durum: "Yayında" },
          { Sayfa: "İade & İptal Politikası", Slug: "/yasal/iade", "Son Güncelleme": "06.05.2026", Versiyon: "v2.1 (fire notu)", Durum: "Yayında" },
          { Sayfa: "Kargolama Politikası", Slug: "/yasal/kargo", "Son Güncelleme": "06.05.2026", Versiyon: "v1.2", Durum: "Yayında" },
        ],
      }}
      features={[
        "WYSIWYG editör (HTML çıktı)",
        "Versiyon takibi (her güncelleme yeni versiyon)",
        "Otomatik 'son güncelleme' tarihi",
        "PDF olarak dışa aktarma",
        "Şablon değişkenleri (\\${COMPANY}, \\${EMAIL}, \\${PHONE}, \\${BRAND}) — genel ayarlardan otomatik dolar",
        "Yasal metin değişikliklerinde aktif kullanıcılara e-posta bildirim opsiyonu",
      ]}
      endpoints={[
        { method: "GET", path: "/api/legal/:slug", desc: "Yasal sayfayı getir" },
        { method: "PATCH", path: "/api/legal/:slug", desc: "İçerik güncelle (yeni versiyon)" },
        { method: "GET", path: "/api/legal/:slug/versions", desc: "Versiyon geçmişi" },
        { method: "POST", path: "/api/legal/notify", desc: "Aktif üyelere değişiklik maili" },
      ]}
    />
  );
}
