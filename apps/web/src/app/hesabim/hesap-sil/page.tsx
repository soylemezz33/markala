import { redirect } from "next/navigation";

/**
 * Eski "Hesabı Sil" sayfası silmeyi yalnızca taklit ediyordu (logout+alert, backend yok).
 * Gerçek/çalışan KVKK silme akışı /hesabim/veri-yonetimi'nde (parola+onay → /api/hesabim/hesap-sil).
 * Bookmark/direkt link gelenleri oraya yönlendiriyoruz; sahte başarı mesajı kaldırıldı.
 */
export default function DeleteAccountRedirect() {
  redirect("/hesabim/veri-yonetimi");
}
