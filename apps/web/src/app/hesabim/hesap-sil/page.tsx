"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@markala/ui";
import { Trash, Warning, ShieldCheck, FileText, Download } from "@phosphor-icons/react";
import { useAuthStore } from "@/lib/auth-store";

export default function DeleteAccountPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const [confirmText, setConfirmText] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [reason, setReason] = useState("");

  const canDelete = confirmText === "HESABIMI SİL" && agreed;

  function onDelete() {
    if (!canDelete) return;
    if (confirm("Hesabınız ve tüm verileriniz kalıcı olarak silinecek. Devam etmek istediğinize emin misiniz?\n\nBu işlem GERİ ALINAMAZ.")) {
      logout();
      router.replace("/");
      alert("Hesabınız silinme talebi alındı. KVKK gereği 30 gün içinde tüm verileriniz sistemlerimizden temizlenecektir. Onay e-postası adresinize gönderildi.");
    }
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <header>
        <h2 className="text-xl md:text-2xl font-semibold text-ink-900 flex items-center gap-2">
          <Trash size={24} weight="bold" className="text-error" />
          Hesabı Sil (KVKK)
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          KVKK 11. madde kapsamında kişisel verilerinizin silinmesini talep edebilirsiniz.
        </p>
      </header>

      {/* Önce verilerini indir */}
      <div className="p-5 bg-paper-100 border border-paper-200 rounded-xl">
        <h3 className="font-semibold text-ink-900 flex items-center gap-2">
          <Download size={16} className="text-brand-700" />
          Önce verilerinizi indirin
        </h3>
        <p className="mt-2 text-sm text-ink-700 leading-relaxed">
          Hesabınızı silmeden önce KVKK 11/d kapsamında tüm kişisel verilerinizi (siparişler, faturalar, adresler, yorumlar) JSON formatında indirebilirsiniz.
        </p>
        <button
          onClick={() => alert("KVKK veri indirme talebi alındı (mock). 24 saat içinde e-postanıza JSON dosyası gönderilecek.")}
          className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium border border-paper-300 hover:bg-paper-50"
        >
          <Download size={14} weight="bold" /> Tüm Verilerimi İndir (.json)
        </button>
      </div>

      {/* Uyarı */}
      <div className="p-5 bg-error/5 border border-error/20 rounded-xl">
        <h3 className="font-semibold text-error flex items-center gap-2">
          <Warning size={16} weight="fill" />
          Bu işlem geri alınamaz
        </h3>
        <ul className="mt-3 text-sm text-ink-700 space-y-1.5 list-disc list-inside leading-relaxed">
          <li>Kişisel bilgileriniz (ad, soyad, adres, telefon) 30 gün içinde silinecek</li>
          <li>Sipariş geçmişiniz <strong className="text-ink-900">VUK 213 gereği</strong> 10 yıl saklanır (anonimleştirilmiş halde)</li>
          <li>Faturalarınızdaki vergi bilgileri yasal olarak korunur</li>
          <li>Hesabınızla bağlı yorumlarınız "Anonim" olarak güncellenir veya silinir (tercihiniz)</li>
          <li>Bu e-posta ile aynı adrese tekrar üye olabilirsiniz, ancak geçmiş veriler geri gelmez</li>
        </ul>
      </div>

      {/* Sebep (opsiyonel) */}
      <div className="p-5 bg-paper-50 border border-paper-200 rounded-xl">
        <h3 className="font-semibold text-ink-900 mb-3 text-sm">Sebep belirtir misiniz? (opsiyonel)</h3>
        <p className="text-xs text-ink-500 mb-3">Hizmetimizi geliştirmek için. Cevabınız zorunlu değil.</p>
        <div className="space-y-2">
          {[
            "Artık matbaa ürünü ihtiyacım yok",
            "Başka bir matbaa firmasına geçtim",
            "Fiyatlardan memnun kalmadım",
            "Ürün kalitesi beklediğim gibi değildi",
            "Müşteri hizmetlerinden memnun kalmadım",
            "Diğer (lütfen belirtin)",
          ].map((r) => (
            <label key={r} className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="radio" name="reason" value={r} onChange={(e) => setReason(e.target.value)} />
              <span className="text-ink-700">{r}</span>
            </label>
          ))}
          {reason === "Diğer (lütfen belirtin)" && (
            <textarea
              placeholder="Açıklama..."
              rows={2}
              className="mt-2 w-full px-3 py-2 rounded-md border border-paper-200 bg-paper-50 text-sm"
            />
          )}
        </div>
      </div>

      {/* Onay */}
      <div className="p-6 bg-paper-50 border-2 border-error/30 rounded-xl">
        <label className="flex items-start gap-3 mb-4 cursor-pointer">
          <input
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-0.5"
          />
          <span className="text-sm text-ink-700 leading-relaxed">
            Hesabımın silinmesinin <strong className="text-ink-900">geri alınamaz</strong> olduğunu, sipariş ve fatura geçmişimin VUK gereği anonimleştirilerek 10 yıl saklanacağını okudum, anladım ve <strong className="text-ink-900">{user?.email ?? "..."}</strong> adresine bağlı hesabımın silinmesini onaylıyorum.
          </span>
        </label>

        <label className="block">
          <span className="block text-sm font-medium text-ink-900 mb-2">
            Onaylamak için aşağıya <code className="font-mono bg-error/10 text-error px-1.5 py-0.5 rounded">HESABIMI SİL</code> yazın:
          </span>
          <input
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            className="w-full px-4 py-3 rounded-lg border border-paper-200 bg-paper-50 text-ink-900 font-mono text-sm focus:border-error focus:outline-none focus-visible:ring-2 focus-visible:ring-error/30"
          />
        </label>

        <Button
          variant="primary"
          fullWidth
          onClick={onDelete}
          disabled={!canDelete}
          className="mt-5 !bg-error hover:!bg-error/90"
        >
          <Trash size={14} weight="bold" /> Hesabımı Kalıcı Olarak Sil
        </Button>
      </div>

      {/* Yasal */}
      <div className="p-5 bg-paper-100 border border-paper-200 rounded-xl text-xs text-ink-700">
        <h3 className="font-semibold text-ink-900 mb-2 flex items-center gap-2">
          <ShieldCheck size={14} className="text-success" />
          KVKK Hakkında
        </h3>
        <p className="leading-relaxed">
          6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) 11. maddesi gereğince
          kişisel verilerinizin silinmesini, yok edilmesini veya anonim hale getirilmesini
          talep edebilirsiniz. Talebiniz 30 gün içinde sonuçlandırılır. Detaylı bilgi için{" "}
          <Link href="/yasal/kvkk" className="text-brand-700 underline font-medium">KVKK Aydınlatma Metni</Link>'ne bakınız.
        </p>
        <p className="mt-2 leading-relaxed">
          Yardıma ihtiyacınız varsa{" "}
          <a href="mailto:kvkk@markala.com.tr" className="text-brand-700 underline">kvkk@markala.com.tr</a>{" "}
          adresine yazabilirsiniz.
        </p>
      </div>
    </div>
  );
}
