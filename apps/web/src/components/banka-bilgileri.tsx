"use client";

import { useState } from "react";
import { Bank, Check, Copy, Warning } from "@phosphor-icons/react";
import { BANKA_HESABI } from "@/lib/company";

/**
 * Havale/EFT hesap bilgileri — TEK GÖRSEL KAYNAK.
 *
 * Aynı bilgi üç yerde görünüyor: /iletisim ("Banka Bilgilerimiz"), müşteri
 * sipariş listesi ve sipariş detayı. Üçünü ayrı ayrı yazmak IBAN'ın zamanla
 * ayrışması demekti — rakam tek dosyadan (lib/company → packages/types), sunum
 * da tek bileşenden gelir.
 *
 * DOLANDIRICILIK UYARISI HER YERDE: "IBAN değişti" konulu sahte mesajlar
 * Türkiye'de yaygın bir saldırı. E-postalardaki uyarının aynısı burada da var;
 * müşteri aynı cümleyi her kanalda görsün diye.
 */

/** Panoya kopyalayan küçük buton — IBAN'ı elle yazarken hata yapılmasın. */
function Kopyala({ metin, etiket }: { metin: string; etiket: string }) {
  const [kopyalandi, setKopyalandi] = useState(false);

  async function kopyala() {
    try {
      await navigator.clipboard.writeText(metin);
      setKopyalandi(true);
      window.setTimeout(() => setKopyalandi(false), 2000);
    } catch {
      /* Pano izni yoksa sessiz geç — metin zaten ekranda seçilebilir durumda. */
    }
  }

  return (
    <button
      type="button"
      onClick={kopyala}
      aria-label={`${etiket} kopyala`}
      className="inline-flex items-center gap-1 rounded-md border border-paper-200 bg-paper-50 px-2 py-0.5 text-[11px] font-medium text-ink-700 transition-colors hover:border-ink-300 hover:text-ink-900"
    >
      {kopyalandi ? <Check size={12} weight="bold" className="text-success" /> : <Copy size={12} />}
      {kopyalandi ? "Kopyalandı" : "Kopyala"}
    </button>
  );
}

function Satir({
  etiket,
  deger,
  mono,
  kopyala,
}: {
  etiket: string;
  deger: string;
  mono?: boolean;
  kopyala?: string;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 py-1.5">
      <dt className="text-sm text-ink-500">{etiket}</dt>
      <dd className="flex items-center gap-2">
        <span className={mono ? "font-mono text-sm font-semibold text-ink-900" : "text-sm text-ink-900"}>
          {deger}
        </span>
        {kopyala && <Kopyala metin={kopyala} etiket={etiket} />}
      </dd>
    </div>
  );
}

export interface BankaBilgileriProps {
  /**
   * Sipariş bağlamında gösteriliyorsa tutar ve sipariş numarası da yazılır —
   * müşterinin açıklamaya yazması gereken referans budur.
   */
  siparis?: { orderNumber: string; tutar: number };
  /** Başlık gösterilsin mi (iletişim sayfasında evet, sipariş kartında hayır). */
  baslik?: boolean;
  className?: string;
}

export function BankaBilgileri({ siparis, baslik = true, className }: BankaBilgileriProps) {
  return (
    <div
      className={`rounded-xl border border-paper-200 bg-paper-50 p-5 ${className ?? ""}`}
    >
      {baslik && (
        <div className="mb-3 flex items-center gap-2">
          <Bank size={18} weight="fill" className="text-brand-700" />
          <h3 className="font-semibold text-ink-900">Banka Bilgilerimiz</h3>
        </div>
      )}

      <dl className="divide-y divide-paper-200">
        <Satir etiket="Alıcı" deger={BANKA_HESABI.unvan} />
        <Satir etiket="Banka" deger={BANKA_HESABI.banka} />
        <Satir etiket="IBAN" deger={BANKA_HESABI.iban} mono kopyala={BANKA_HESABI.ibanDuz} />
        {siparis && (
          <>
            <Satir
              etiket="Tutar"
              deger={`${siparis.tutar.toLocaleString("tr-TR", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })} ₺`}
            />
            <Satir
              etiket="Açıklama"
              deger={siparis.orderNumber}
              mono
              kopyala={siparis.orderNumber}
            />
          </>
        )}
      </dl>

      {siparis && (
        <p className="mt-3 rounded-md border border-brand-500/25 bg-brand-50/60 px-3 py-2 text-xs text-ink-700">
          <strong className="text-ink-900">Açıklama alanına sipariş numaranı yaz.</strong>{" "}
          Ödemeni siparişinle bu numara üzerinden eşleştiriyoruz; yazılmazsa onay gecikir.
        </p>
      )}

      <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-ink-500">
        <Warning size={13} className="mt-0.5 shrink-0" />
        <span>
          Hesap bilgilerimiz değişmez. Farklı bir IBAN&apos;a ödeme isteyen e-posta veya
          mesaj alırsanız dikkate almayın, bizi 0324 433 33 51&apos;den arayın.
        </span>
      </p>
    </div>
  );
}

/**
 * "Ödemeni bekliyoruz" uyarısı — YALNIZ havale siparişinde, ödeme henüz
 * onaylanmamışken ve sipariş iptal değilken görünür.
 *
 * Neden gerekli (2026-09-02, Hasan istedi): havale siparişinde para otomatik
 * gelmiyor; müşteri ödemeyi unutur ya da IBAN'ı kaybederse sipariş beklemede
 * kalıyor. Hesabındaki sipariş kartında hesap bilgisi ve referans numarası
 * elinin altında olmalı — e-postayı bulmak zorunda kalmasın.
 *
 * Onay AKIŞI: admin "ödeme geldi" dediğinde paymentStatus="basarili" olur ve
 * bu uyarı kendiliğinden kaybolur.
 */
export interface HavaleDurumu {
  status?: string | null;
  paymentStatus?: string | null;
  paymentMethod?: string | null;
}

/**
 * Uyarı gösterilmeli mi? Saf fonksiyon — bileşenin içine gömülü kalsaydı test
 * edilemezdi. ÖDENMİŞ ya da İPTAL edilmiş siparişte banka bilgisi göstermek
 * müşteriyi ikinci kez ödemeye itebilir; kural bu yüzden çakılı.
 */
export function havaleOdemeBekliyorMu(order: HavaleDurumu): boolean {
  if (order.paymentMethod !== "havale") return false;
  if (order.paymentStatus === "basarili") return false;
  // Prisma enum'u "iptal_edildi", slug hâli "iptal-edildi" — ikisini de karşıla.
  if (String(order.status ?? "").replace(/_/g, "-") === "iptal-edildi") return false;
  return true;
}

export function HavaleOdemeBekliyor({
  order,
  className,
}: {
  order: HavaleDurumu & { orderNumber: string; total: number | string };
  className?: string;
}) {
  if (!havaleOdemeBekliyorMu(order)) return null;

  return (
    <div className={className}>
      <div className="mb-2 flex items-center gap-2 rounded-lg border border-warning/30 bg-warning/10 px-3 py-2">
        <Warning size={16} weight="fill" className="shrink-0 text-warning" />
        <p className="text-sm font-medium text-ink-900">
          Ödemeni bekliyoruz — havale ulaşınca siparişin üretime alınacak.
        </p>
      </div>
      <BankaBilgileri
        baslik={false}
        siparis={{ orderNumber: order.orderNumber, tutar: Number(order.total) || 0 }}
      />
    </div>
  );
}
