import type { Metadata } from "next";
import { LoginClient } from "./login-client";
import { safeNextPath } from "@/lib/safe-redirect";

/**
 * Giriş sayfası — SUNUCU bileşeni (2026-08-31).
 *
 * NEDEN BÖYLE: Sayfa eskiden baştan sona `"use client"` idi ve gövdesinde
 * `useSearchParams()` çağırıyordu. Etrafında Suspense sınırı olmadığı için Next.js
 * TÜM sayfayı istemci tarafına devrediyordu — canlı HTML'de sayfanın kendi
 * `BAILOUT_TO_CLIENT_SIDE_RENDERING` işareti vardı ve sunucudan gelen çıktıda
 * "E-posta", "Şifre", "Şifrenizi mi unuttunuz?" ifadelerinin HİÇBİRİ yoktu.
 * Sonuç: JavaScript inene kadar form görünmüyordu — üstelik "Ödemeye Geç" diyen
 * müşteri tam bu ekrana düşüyor. (Kardeş sayfa /kayit hook'u kullanmadığı için
 * sağlıklıydı; kıyaslama teşhisi kesinleştirdi.)
 *
 * `next` parametresi artık burada, sunucuda okunuyor ve prop olarak geçiliyor.
 * 20 Ağustos'taki CLS düzeltmesinin kazancı korunuyor: değer ilk render'da hazır
 * olduğu için sepet özeti bloğuna yer baştan ayrılır, form aşağı itilmez.
 */
export const metadata: Metadata = {
  title: "Giriş Yap",
  robots: { index: false, follow: false },
};

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string | string[] };
}) {
  const ham = Array.isArray(searchParams.next) ? searchParams.next[0] : searchParams.next;
  // safeNextPath açık yönlendirmeyi (ters-bölü / protokol-relatif dahil) eler.
  const nextParam = safeNextPath(ham ?? null);
  return <LoginClient nextParam={nextParam} />;
}
