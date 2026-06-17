"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@markala/ui";
import { apiClient, withRefresh } from "@/lib/api";
import {
  Download,
  Trash,
  ShieldCheck,
  Warning,
  EnvelopeSimple,
  ChatCircle,
  Bell,
  Megaphone,
  CheckCircle,
  Database,
  X,
  Lock,
} from "@phosphor-icons/react";
import { useAuthStore } from "@/lib/auth-store";

/**
 * KVKK / GDPR self-service veri yönetimi paneli.
 * 3 bölüm:
 *  1. Verilerimi İndir — JSON export (siparişler, adresler, profil, yorumlar)
 *  2. Hesabımı Sil — 2 aşamalı confirm (TC veya parola + onay metni)
 *  3. Pazarlama Tercihleri — e-posta / SMS marketing toggle (zorunlu bildirimlerden ayrı)
 *
 * Auth check: hesabim layout zaten user yoksa /giris'e atıyor.
 */
export default function VeriYonetimiPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);

  // Export state
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  // Delete state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStage, setDeleteStage] = useState<1 | 2>(1);
  const [confirmText, setConfirmText] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Marketing prefs
  const [emailMarketing, setEmailMarketing] = useState(true);
  const [smsMarketing, setSmsMarketing] = useState(false);
  const [pushMarketing, setPushMarketing] = useState(false);
  const [personalizedAds, setPersonalizedAds] = useState(true);
  const [prefsSaved, setPrefsSaved] = useState(false);
  const [prefsSaving, setPrefsSaving] = useState(false);
  const [prefsError, setPrefsError] = useState<string | null>(null);
  // Bildirim tercihleri (sipariş/kargo vb.) ile aynı notificationPrefs JSON'ında saklanıyor;
  // marketing'i merge ederken üzerine yazmamak için tüm prefs'i tutuyoruz.
  const loadedPrefs = useRef<Record<string, unknown>>({});

  // Kayıtlı pazarlama tercihlerini yükle.
  useEffect(() => {
    withRefresh(() => apiClient.users.getNotificationPrefs())
      .then((stored) => {
        if (stored && typeof stored === "object") {
          loadedPrefs.current = stored as Record<string, unknown>;
          const m = (stored as Record<string, { email?: boolean; sms?: boolean; push?: boolean; ads?: boolean }>).marketing;
          if (m && typeof m === "object") {
            setEmailMarketing(!!m.email);
            setSmsMarketing(!!m.sms);
            setPushMarketing(!!m.push);
            setPersonalizedAds(!!m.ads);
          }
        }
      })
      .catch(() => {});
  }, []);

  if (!user) return null;

  async function handleExport() {
    setExporting(true);
    setExportError(null);
    try {
      const token = useAuthStore.getState().accessToken;
      const res = await fetch("/api/hesabim/veri-export", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        setExportError(j.error ?? "Veri indirme başarısız oldu.");
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `markala-verilerim-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      setExportError("Sunucuya ulaşılamadı.");
    } finally {
      setExporting(false);
    }
  }

  function openDeleteModal() {
    setShowDeleteModal(true);
    setDeleteStage(1);
    setConfirmText("");
    setConfirmPassword("");
    setDeleteError(null);
  }

  function closeDeleteModal() {
    setShowDeleteModal(false);
    setDeleteStage(1);
    setConfirmText("");
    setConfirmPassword("");
    setDeleteError(null);
  }

  async function handleDelete() {
    if (confirmText !== "HESABIMI SİL") {
      setDeleteError("Onay metni tam olarak \"HESABIMI SİL\" olmalı.");
      return;
    }
    if (confirmPassword.length < 4) {
      setDeleteError("Parolanızı girin.");
      return;
    }
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch("/api/hesabim/hesap-sil", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user?.email,
          password: confirmPassword,
          confirmText,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setDeleteError(data.error ?? "Hesap silme başarısız oldu.");
        return;
      }
      logout();
      router.replace("/?account_deleted=1");
    } catch {
      setDeleteError("Sunucuya ulaşılamadı.");
    } finally {
      setDeleting(false);
    }
  }

  async function savePrefs() {
    setPrefsSaving(true);
    setPrefsError(null);
    // Mevcut bildirim tercihlerini koru, yalnız marketing'i güncelle.
    const merged = {
      ...loadedPrefs.current,
      marketing: { email: emailMarketing, sms: smsMarketing, push: pushMarketing, ads: personalizedAds },
    };
    try {
      await withRefresh(() => apiClient.users.updateNotificationPrefs(merged));
      loadedPrefs.current = merged;
      setPrefsSaved(true);
      setTimeout(() => setPrefsSaved(false), 2500);
    } catch {
      setPrefsError("Kaydedilemedi, lütfen tekrar deneyin.");
    } finally {
      setPrefsSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <h2 className="text-xl md:text-2xl font-semibold text-ink-900 flex items-center gap-2">
          <ShieldCheck size={24} weight="bold" className="text-brand-700" />
          Veri Yönetimi (KVKK / GDPR)
        </h2>
        <p className="mt-1 text-sm text-ink-500">
          Kişisel verileriniz üzerinde tam kontrol sizde. KVKK 11. madde ve GDPR Madde 15-22 kapsamında haklarınızı kullanabilirsiniz.
        </p>
      </header>

      {/* 1. Verilerimi İndir */}
      <section
        aria-labelledby="export-title"
        className="p-6 bg-paper-50 border border-paper-200 rounded-xl"
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-lg bg-brand-100 text-brand-700 grid place-items-center flex-none">
            <Download size={20} weight="bold" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 id="export-title" className="font-semibold text-ink-900 text-lg">
              Verilerimi İndir
            </h3>
            <p className="mt-1 text-sm text-ink-700 leading-relaxed">
              Hesabınıza ait tüm kişisel veriyi (profil, siparişler, adresler, yorumlar, favoriler) tek bir JSON dosyası olarak indirin. KVKK 11/d ve GDPR Madde 20 (veri taşınabilirliği) hakkınız.
            </p>
            <ul className="mt-3 grid sm:grid-cols-2 gap-1.5 text-xs text-ink-700">
              <li className="flex items-center gap-1.5">
                <CheckCircle size={12} weight="fill" className="text-success flex-none" /> Profil bilgileri
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle size={12} weight="fill" className="text-success flex-none" /> Sipariş geçmişi
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle size={12} weight="fill" className="text-success flex-none" /> Kayıtlı adresler
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle size={12} weight="fill" className="text-success flex-none" /> Yorum ve değerlendirmeler
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle size={12} weight="fill" className="text-success flex-none" /> Favori listesi
              </li>
              <li className="flex items-center gap-1.5">
                <CheckCircle size={12} weight="fill" className="text-success flex-none" /> Pazarlama tercihleri
              </li>
            </ul>
            {exportError && (
              <p className="mt-3 text-sm text-error" role="alert">
                {exportError}
              </p>
            )}
            <div className="mt-4 flex items-center gap-3">
              <Button onClick={handleExport} disabled={exporting}>
                <Download size={14} weight="bold" />
                {exporting ? "Hazırlanıyor..." : "JSON Olarak İndir"}
              </Button>
              <span className="text-xs text-ink-500">
                <Database size={12} className="inline mb-0.5" /> Dosya boyutu ~5-50 KB
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Pazarlama Tercihleri */}
      <section
        aria-labelledby="prefs-title"
        className="p-6 bg-paper-50 border border-paper-200 rounded-xl"
      >
        <div className="flex items-start gap-4 mb-5">
          <div className="w-11 h-11 rounded-lg bg-success/10 text-success grid place-items-center flex-none">
            <Megaphone size={20} weight="bold" />
          </div>
          <div>
            <h3 id="prefs-title" className="font-semibold text-ink-900 text-lg">
              Pazarlama Tercihlerim
            </h3>
            <p className="mt-1 text-sm text-ink-700 leading-relaxed">
              Markala&apos;dan hangi kanaldan, hangi tipte pazarlama içeriği almak istediğinizi seçin. Sipariş bildirimleri zorunludur ve burada değiştirilemez (
              <Link href="/hesabim/bildirim" className="text-brand-700 underline">
                bildirim tercihleri
              </Link>
              ).
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <ConsentRow
            icon={EnvelopeSimple}
            title="E-posta Pazarlama"
            desc="Aylık kampanyalar, yeni ürünler, indirim kuponları"
            checked={emailMarketing}
            onChange={setEmailMarketing}
          />
          <ConsentRow
            icon={ChatCircle}
            title="SMS Pazarlama"
            desc="Flash kampanyalar (ayda en fazla 2 mesaj)"
            checked={smsMarketing}
            onChange={setSmsMarketing}
          />
          <ConsentRow
            icon={Bell}
            title="Web / Push Bildirim"
            desc="Tarayıcı bildirimleri ile öncelikli kampanya erişimi"
            checked={pushMarketing}
            onChange={setPushMarketing}
          />
          <ConsentRow
            icon={ShieldCheck}
            title="Kişiselleştirilmiş Reklam"
            desc="Google / Meta ölçüm pikselleri ile size özel reklam içeriği"
            checked={personalizedAds}
            onChange={setPersonalizedAds}
          />
        </div>

        <div className="mt-5 flex items-center justify-between gap-3 pt-4 border-t border-paper-200">
          <button
            type="button"
            onClick={() => {
              setEmailMarketing(false);
              setSmsMarketing(false);
              setPushMarketing(false);
              setPersonalizedAds(false);
            }}
            className="text-sm text-error hover:underline font-medium"
          >
            Tüm pazarlamayı kapat
          </button>
          <div className="flex items-center gap-3">
            {prefsSaved && (
              <span className="inline-flex items-center gap-1.5 text-sm text-success font-medium">
                <CheckCircle size={16} weight="fill" /> Kaydedildi
              </span>
            )}
            {prefsError && <span className="text-sm text-error font-medium">{prefsError}</span>}
            <Button onClick={savePrefs} disabled={prefsSaving}>{prefsSaving ? "Kaydediliyor…" : "Kaydet"}</Button>
          </div>
        </div>
      </section>

      {/* 3. Hesabımı Sil — DANGER */}
      <section
        aria-labelledby="delete-title"
        className="p-6 bg-error/5 border-2 border-error/20 rounded-xl"
      >
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-lg bg-error/10 text-error grid place-items-center flex-none">
            <Trash size={20} weight="bold" />
          </div>
          <div className="flex-1 min-w-0">
            <h3
              id="delete-title"
              className="font-semibold text-ink-900 text-lg flex items-center gap-2"
            >
              Hesabımı Sil
              <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded bg-error text-paper-50">
                Geri alınamaz
              </span>
            </h3>
            <p className="mt-1 text-sm text-ink-700 leading-relaxed">
              Hesabınız ve bağlı kişisel veriler kalıcı olarak silinir. Sipariş ve fatura kayıtları VUK 213 gereği <strong className="text-ink-900">10 yıl boyunca anonimleştirilmiş</strong> olarak saklanır.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={openDeleteModal}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-md text-sm font-semibold bg-error text-paper-50 hover:bg-error/90 transition-colors"
              >
                <Trash size={14} weight="bold" /> Hesabımı Kalıcı Sil
              </button>
              <Link
                href="/yasal/kvkk"
                className="text-sm text-ink-700 hover:text-ink-900 underline"
              >
                Önce KVKK metnini oku
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Yasal bilgi alt info */}
      <div className="p-5 bg-paper-100 border border-paper-200 rounded-xl text-xs text-ink-700 leading-relaxed">
        <strong className="text-ink-900 block mb-1 flex items-center gap-1.5">
          <ShieldCheck size={14} className="text-success" /> Yasal dayanak
        </strong>
        Bu sayfadaki işlemler 6698 sayılı Kişisel Verilerin Korunması Kanunu (KVKK) 11. madde ve GDPR Madde 15-22 (erişim, düzeltme, silme, taşınabilirlik) kapsamında veri sahibine tanınan haklardır. Karmaşık talepler için{" "}
        <Link
          href="/kvkk-basvuru"
          className="text-brand-700 underline font-medium"
        >
          resmi başvuru formunu
        </Link>{" "}
        kullanabilirsiniz.
      </div>

      {/* 2 aşamalı silme modal'ı */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-ink-900/60 backdrop-blur-sm p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-modal-title"
        >
          <div className="w-full max-w-md bg-paper-50 rounded-2xl shadow-2xl overflow-hidden">
            <header className="flex items-center justify-between px-6 py-4 border-b border-paper-200 bg-error/5">
              <h3
                id="delete-modal-title"
                className="font-semibold text-ink-900 flex items-center gap-2"
              >
                <Warning size={18} weight="fill" className="text-error" />
                {deleteStage === 1 ? "Emin misiniz?" : "Son onay"}
              </h3>
              <button
                onClick={closeDeleteModal}
                className="text-ink-500 hover:text-ink-900"
                aria-label="Kapat"
              >
                <X size={20} />
              </button>
            </header>

            <div className="p-6 space-y-4">
              {deleteStage === 1 ? (
                <>
                  <p className="text-sm text-ink-700 leading-relaxed">
                    Hesabınızı silmek üzeresiniz. Bu işlem
                    <strong className="text-ink-900"> geri alınamaz</strong>.
                  </p>
                  <ul className="text-xs text-ink-700 space-y-1.5 list-disc list-inside leading-relaxed bg-paper-100 p-4 rounded-lg">
                    <li>Profil, adres ve favorileriniz <strong>30 gün içinde</strong> kalıcı silinir</li>
                    <li>Siparişleriniz anonimleştirilir ancak VUK gereği 10 yıl saklanır</li>
                    <li>Yorumlarınız &quot;Anonim Kullanıcı&quot; olarak değiştirilir</li>
                    <li>Aynı e-posta ile tekrar üye olabilirsiniz, geçmiş veri geri gelmez</li>
                  </ul>
                  <p className="text-xs text-ink-500">
                    İptal etmek için bu pencereyi kapatın veya devam edin.
                  </p>
                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button variant="outline" onClick={closeDeleteModal}>
                      Vazgeç
                    </Button>
                    <button
                      type="button"
                      onClick={() => setDeleteStage(2)}
                      className="inline-flex items-center gap-1.5 px-5 h-11 rounded text-[15px] font-medium bg-error text-paper-50 hover:bg-error/90 transition-colors"
                    >
                      Devam et
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-sm text-ink-700">
                    Hesap silme işlemini doğrulamak için aşağıdaki bilgileri girin:
                  </p>

                  {deleteError && (
                    <div
                      role="alert"
                      aria-live="polite"
                      className="px-3 py-2 rounded bg-error/10 border border-error/20 text-error text-xs"
                    >
                      {deleteError}
                    </div>
                  )}

                  <label className="block">
                    <span className="text-xs font-medium text-ink-900">
                      Onaylamak için <code className="font-mono bg-error/10 text-error px-1 rounded">HESABIMI SİL</code> yazın
                    </span>
                    <input
                      value={confirmText}
                      onChange={(e) => setConfirmText(e.target.value)}
                      className="mt-1.5 w-full px-3 py-2.5 rounded-md border border-paper-200 bg-paper-50 text-sm font-mono"
                      autoComplete="off"
                    />
                  </label>

                  <label className="block">
                    <span className="text-xs font-medium text-ink-900 flex items-center gap-1.5">
                      <Lock size={12} /> Parolanız
                    </span>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="mt-1.5 w-full px-3 py-2.5 rounded-md border border-paper-200 bg-paper-50 text-sm"
                      autoComplete="current-password"
                    />
                  </label>

                  <div className="flex items-center justify-between gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setDeleteStage(1)}
                      className="text-sm text-ink-700 hover:text-ink-900"
                    >
                      ← Geri
                    </button>
                    <button
                      type="button"
                      onClick={handleDelete}
                      disabled={
                        deleting ||
                        confirmText !== "HESABIMI SİL" ||
                        confirmPassword.length < 4
                      }
                      className="inline-flex items-center gap-1.5 px-5 h-11 rounded text-[15px] font-medium bg-error text-paper-50 hover:bg-error/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash size={14} weight="bold" />
                      {deleting ? "Siliniyor..." : "Hesabı Kalıcı Sil"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ConsentRow({
  icon: Icon,
  title,
  desc,
  checked,
  onChange,
}: {
  icon: typeof EnvelopeSimple;
  title: string;
  desc: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border border-paper-200 hover:bg-paper-100/40 transition-colors">
      <div className="w-9 h-9 rounded-md bg-paper-100 grid place-items-center text-ink-700 flex-none">
        <Icon size={16} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-ink-900 text-sm">{title}</div>
        <div className="text-xs text-ink-500 mt-0.5">{desc}</div>
      </div>
      <Toggle checked={checked} onChange={() => onChange(!checked)} />
    </div>
  );
}

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative w-11 h-6 rounded-full transition-colors flex-none ${
        checked ? "bg-brand-500" : "bg-paper-200"
      }`}
      role="switch"
      aria-checked={checked}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-paper-50 shadow transition-transform ${
          checked ? "translate-x-5" : ""
        }`}
      />
    </button>
  );
}
