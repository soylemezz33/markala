"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { Container, Button } from "@markala/ui";
import { XCircle, ClipboardText, WhatsappLogo } from "@phosphor-icons/react";
import { whatsappUrl } from "@/lib/whatsapp";
import { useAuthStore } from "@/lib/auth-store";

/**
 * iyzico ödeme başarısız/iptal yönlendirmesi.
 *
 * Backend ?siparis=<orderId> parametresini URL'e ekler (payments.service.ts handleCallback).
 * Bu sayfa orderId'yi okuyup "Bu Siparişin Ödemesini Tamamla" linki oluşturur — birden fazla
 * bekleyen siparişi olan müşteri hangi siparişin ödemesinin başarısız olduğunu doğrudan görür.
 *
 * Sepet: clearCart() yalnızca iyzico yönlendirme URL'si başarıyla alındıktan sonra çağrılır
 * (odeme/page.tsx — payRes?.ok && payRes.paymentPageUrl şartı). Sipariş oluşturulamaz ya da
 * ödeme başlatılamazsa sepet korunur; müşteri sepetten tekrar deneyebilir.
 */
function PaymentFailedContent() {
  const params = useSearchParams();
  const orderId = params.get("siparis");
  const user = useAuthStore((s) => s.user);
  // Hidrasyon güvenliği: sunucu daima "misafir" varyantını basar, üyelik durumu mount sonrası
  // uygulanır (oturum bilgisi yalnız istemcide var).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const isMember = mounted && !!user;

  /** WhatsApp mesajı sipariş referansını taşısın — destek aramadan bulsun. */
  const supportUrl = whatsappUrl(
    orderId
      ? `Merhaba, ödeme sırasında sorun yaşadım. Sipariş referansım: ${orderId}. Ödememi tamamlamak istiyorum.`
      : "Merhaba, ödeme sırasında sorun yaşadım. Yardımcı olur musunuz?",
  );

  return (
    <Container className="py-16 md:py-24 max-w-xl text-center">
      <div className="w-16 h-16 mx-auto rounded-full bg-red-50 grid place-items-center text-red-500">
        <XCircle size={36} weight="fill" />
      </div>
      <h1 className="mt-5 text-3xl md:text-4xl font-semibold text-ink-900">Ödeme tamamlanamadı</h1>
      <p className="mt-3 text-ink-700">
        Ödemen alınamadı ya da işlem iptal edildi. <strong>Kartından herhangi bir tahsilat yapılmadı.</strong>{" "}
        Siparişin oluşturuldu ve <strong>"Ödeme Bekliyor"</strong> olarak duruyor — dilediğin zaman
        ödemeyi tamamlayabilirsin.
      </p>

      {/* Sipariş referansı ekranda GÖRÜNÜR olsun — misafir müşterinin elinde tutunacak
          tek şey bu (2026-08-26 UX denetimi #3). */}
      {orderId && (
        <p className="mt-4 inline-flex items-center gap-2 rounded-full bg-paper-100 px-4 py-1.5 text-sm">
          Sipariş referansı: <span className="font-mono font-medium text-ink-900">{orderId}</span>
        </p>
      )}

      {/**
       * CTA sırası müşterinin durumuna göre (UX denetimi #3):
       * Eskiden birincil buton HERKESİ `/hesabim/siparislerim/...`e gönderiyordu; misafir
       * müşteri orada giriş duvarına çarpıyor, misafir siparişi hesapta görünmüyor ve sepet de
       * boşaltılmış olduğu için kendi başına kurtulamıyordu. Artık: üye ise hesap linki
       * birincil, MİSAFİR ise WhatsApp birincil (mesajda sipariş referansı hazır gider).
       * `mounted` kapısı: sunucu çıktısı daima misafir varyantı → hidrasyon uyuşmazlığı olmaz.
       */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {isMember ? (
          <>
            <Link href={orderId ? `/hesabim/siparislerim/${orderId}` : "/hesabim/siparislerim"}>
              <Button size="lg">
                <ClipboardText size={18} weight="bold" />{" "}
                {orderId ? "Bu Siparişin Ödemesini Tamamla" : "Siparişlerim → Ödeme Yap"}
              </Button>
            </Link>
            <a href={supportUrl} target="_blank" rel="noopener noreferrer">
              <Button size="lg" variant="outline" className="text-[#1FB358] border-[#25D366]">
                <WhatsappLogo size={18} weight="fill" /> WhatsApp'tan Destek
              </Button>
            </a>
          </>
        ) : (
          <>
            <a href={supportUrl} target="_blank" rel="noopener noreferrer">
              <Button size="lg">
                <WhatsappLogo size={18} weight="fill" /> WhatsApp'tan Ödemeyi Tamamla
              </Button>
            </a>
            <Link href="/giris">
              <Button size="lg" variant="outline">
                <ClipboardText size={18} weight="bold" /> Üye Girişi
              </Button>
            </Link>
          </>
        )}
      </div>

      <p className="mt-8 text-sm text-ink-500">
        {isMember
          ? "Ödemeni hesabındaki sipariş sayfasından dilediğin zaman tamamlayabilirsin."
          : "Giriş yapmadan sipariş verdiğin için ödeme bağlantısını hesabından açamazsın — WhatsApp'tan yaz, sipariş referansınla ödeme bağlantısını hemen ilet edelim."}
      </p>
    </Container>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense fallback={null}>
      <PaymentFailedContent />
    </Suspense>
  );
}
