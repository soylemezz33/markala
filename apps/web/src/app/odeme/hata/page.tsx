"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { Container, Button } from "@markala/ui";
import { XCircle, ClipboardText, WhatsappLogo } from "@phosphor-icons/react";
import { whatsappUrl } from "@/lib/whatsapp";

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

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {orderId ? (
          <Link href={`/hesabim/siparislerim/${orderId}`}>
            <Button size="lg">
              <ClipboardText size={18} weight="bold" /> Bu Siparişin Ödemesini Tamamla
            </Button>
          </Link>
        ) : (
          <Link href="/hesabim/siparislerim">
            <Button size="lg">
              <ClipboardText size={18} weight="bold" /> Siparişlerim → Ödeme Yap
            </Button>
          </Link>
        )}
        <a
          href={whatsappUrl("Merhaba, ödeme sırasında sorun yaşadım. Yardımcı olur musunuz?")}
          target="_blank"
          rel="noopener noreferrer"
        >
          <Button size="lg" variant="outline" className="text-[#1FB358] border-[#25D366]">
            <WhatsappLogo size={18} weight="fill" /> WhatsApp'tan Destek
          </Button>
        </a>
      </div>

      <p className="mt-8 text-sm text-ink-500">
        Giriş yapmadan sipariş verdiysen ödemeni tamamlamak için{" "}
        <a
          href={whatsappUrl("Merhaba, misafir olarak sipariş verdim, ödememi tamamlamak istiyorum.")}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-700 hover:underline"
        >
          WhatsApp'tan bize ulaş
        </a>
        , sipariş numaranla ödeme bağlantısını ilet edelim.
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
