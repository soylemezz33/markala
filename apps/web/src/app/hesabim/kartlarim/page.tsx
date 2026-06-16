"use client";

import { CreditCard, ShieldCheck, Lock } from "@phosphor-icons/react";
import { Button } from "@markala/ui";

export default function SavedCardsPage() {
  return (
    <div className="space-y-6 max-w-2xl">
      <header className="flex items-center justify-between gap-4">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-ink-900 flex items-center gap-2">
            <CreditCard size={24} weight="bold" className="text-brand-700" />
            Kayıtlı Kartlarım
          </h2>
          <p className="mt-1 text-sm text-ink-500">Ödeme adımında hızlı ödeme için kartlarınızı güvenle saklayın.</p>
        </div>
        <span className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold text-success">
          <ShieldCheck size={16} weight="fill" /> Güvende
        </span>
      </header>

      <div className="text-center py-16 bg-paper-50 border border-paper-200 rounded-xl">
        <div className="w-16 h-16 mx-auto rounded-full bg-paper-100 grid place-items-center text-ink-500">
          <CreditCard size={28} />
        </div>
        <h3 className="mt-5 font-semibold text-ink-900 text-lg">Henüz kayıtlı kartınız yok</h3>
        <p className="mt-2 text-sm text-ink-500 max-w-md mx-auto">
          Güvenli ödeme altyapısı (iyzico + 3D Secure) ile kart kaydı çok yakında aktif olacak.
        </p>
        <Button className="mt-5" disabled>
          <CreditCard size={16} weight="bold" /> Kart Ekle (yakında)
        </Button>
      </div>

      <div className="p-5 bg-paper-100 border border-paper-200 rounded-xl text-sm">
        <h3 className="font-semibold text-ink-900 mb-2 flex items-center gap-2">
          <Lock size={16} className="text-success" />
          Kart bilgileriniz Markala'da saklanmaz
        </h3>
        <ul className="text-ink-700 space-y-1 text-xs leading-relaxed list-disc list-inside">
          <li>Kart numaranız Markala sunucularında <strong>tutulmaz</strong>; ödeme sağlayıcısının PCI-DSS sertifikalı kasasında saklanır.</li>
          <li>Kayıtlı kartla ödemede yeni adres/bilgi değişikliğinde SMS onayı istenir.</li>
          <li>Kartlarınızı dilediğiniz an silebilirsiniz.</li>
        </ul>
      </div>
    </div>
  );
}
