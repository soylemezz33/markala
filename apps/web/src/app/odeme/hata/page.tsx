"use client";

import Link from "next/link";
import { Container, Button } from "@markala/ui";
import { XCircle, ArrowCounterClockwise, WhatsappLogo } from "@phosphor-icons/react";
import { whatsappUrl } from "@/lib/whatsapp";

/**
 * iyzico ödeme başarısız/iptal yönlendirmesi. Sepet KORUNUR (ödeme öncesi temizlenmiyor),
 * kullanıcı tekrar deneyebilir. Sipariş backend'de paymentStatus=basarisiz olarak kalır.
 */
export default function PaymentFailedPage() {
  return (
    <Container className="py-16 md:py-24 max-w-xl text-center">
      <div className="w-16 h-16 mx-auto rounded-full bg-red-50 grid place-items-center text-red-500">
        <XCircle size={36} weight="fill" />
      </div>
      <h1 className="mt-5 text-3xl md:text-4xl font-semibold text-ink-900">Ödeme tamamlanamadı</h1>
      <p className="mt-3 text-ink-700">
        Ödemen alınamadı ya da işlem iptal edildi. Kartından herhangi bir tahsilat yapılmadı.
        Sepetin korundu — dilersen tekrar deneyebilirsin.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Link href="/odeme">
          <Button size="lg">
            <ArrowCounterClockwise size={18} weight="bold" /> Tekrar Dene
          </Button>
        </Link>
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
        Sorun devam ederse{" "}
        <Link href="/sepet" className="text-brand-700 hover:underline">sepetine</Link> dönüp tekrar deneyebilir
        veya bizimle iletişime geçebilirsin.
      </p>
    </Container>
  );
}
