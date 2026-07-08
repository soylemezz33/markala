"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Cookie } from "@phosphor-icons/react";

const COOKIE_NAME = "markala_cookie_consent";
const COOKIE_MAX_AGE = 60 * 60 * 24 * 365; // 1 yıl
const REOPEN_EVENT = "markala:open-cookie-settings";

/**
 * Consent şemasının sürümü. KVKK/GDPR gereği üçüncü taraf çerez setine veya
 * aktarım kapsamına dokunan her değişiklikte artırın — eski sürüme sahip
 * kullanıcıların banner'ı yeniden onaylaması gerekir.
 *
 * v1.1 → Microsoft Clarity için ayrı "preferences" kategorisi eklendi.
 * Clarity oturum kayıtları anonim GA4 istatistiklerinden farklı bir
 * işleme amacına sahiptir (KVKK m.4/2-ç: amaçla bağlantılılık).
 */
const CONSENT_VERSION = "1.1";

interface ConsentState {
  necessary: true; // her zaman aktif
  analytics: boolean; // GA4 — anonim trafik istatistikleri
  preferences: boolean; // Microsoft Clarity — oturum kayıtları, ısı haritası
  marketing: boolean; // Meta Pixel, Google Ads
  timestamp: number;
  /** v1.0'dan itibaren zorunlu — eski kayıtlarda undefined olabilir. */
  version?: string;
}

function readConsent(): ConsentState | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(new RegExp(`(?:^|; )${COOKIE_NAME}=([^;]+)`));
  if (!m || !m[1]) return null;
  try {
    return JSON.parse(decodeURIComponent(m[1]));
  } catch {
    return null;
  }
}

function writeConsent(state: ConsentState): void {
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(state))}; path=/; max-age=${COOKIE_MAX_AGE}; samesite=lax${secure}`;
  // Google Consent Mode v2 — analytics.tsx'deki `denied` default'u güncelle
  if (
    typeof window !== "undefined" &&
    typeof (window as Window & { gtag?: (...args: unknown[]) => void }).gtag === "function"
  ) {
    const g = (window as Window & { gtag: (...args: unknown[]) => void }).gtag;
    g("consent", "update", {
      analytics_storage: state.analytics ? "granted" : "denied",
      // preferences (Clarity) uses functionality_storage signal
      functionality_storage: state.preferences ? "granted" : "denied",
      ad_storage: state.marketing ? "granted" : "denied",
      ad_user_data: state.marketing ? "granted" : "denied",
      ad_personalization: state.marketing ? "granted" : "denied",
      personalization_storage: state.marketing ? "granted" : "denied",
    });
  }
  // Meta Pixel — KVKK: pazarlama onayına göre grant/revoke (analytics.tsx revoke ile başlatır).
  const fbq = (window as Window & { fbq?: (...args: unknown[]) => void }).fbq;
  if (typeof fbq === "function") {
    fbq("consent", state.marketing ? "grant" : "revoke");
  }
}

/**
 * KVKK & GDPR uyumlu çerez onay banner'ı.
 * Sadece consent verilmediyse gösterilir.
 *
 * Detay seçimi: kullanıcı analytics/marketing'i ayrı ayrı kapatabilir.
 * Onay sonrası 1 yıl gösterilmez.
 */
export function CookieConsent() {
  const [show, setShow] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [analytics, setAnalytics] = useState(true);
  const [preferences, setPreferences] = useState(true);
  const [marketing, setMarketing] = useState(true);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const existing = readConsent();
    const isStale = !existing || existing.version !== CONSENT_VERSION;
    if (isStale) {
      // İlk yüklemede ya da consent şeması güncellendiyse banner'ı tekrar göster.
      const t = setTimeout(() => setShow(true), 800);
      // Eski tercihleri pre-fill yap ki kullanıcı tekrar onay verirken zorlanmasın
      if (existing) {
        setAnalytics(existing.analytics);
        setPreferences(existing.preferences ?? true);
        setMarketing(existing.marketing);
      }
      return () => clearTimeout(t);
    } else {
      // Mevcut tercihleri form state'e yükle (re-open için)
      setAnalytics(existing.analytics);
      setPreferences(existing.preferences ?? true);
      setMarketing(existing.marketing);
    }

    // "Çerez Tercihleri" linki herhangi bir yerden tetiklenebilsin
    function reopen() {
      const c = readConsent();
      if (c) {
        setAnalytics(c.analytics);
        setPreferences(c.preferences ?? true);
        setMarketing(c.marketing);
      }
      setShowDetails(true);
      setShow(true);
    }
    window.addEventListener(REOPEN_EVENT, reopen);
    return () => window.removeEventListener(REOPEN_EVENT, reopen);
  }, []);

  function acceptAll() {
    writeConsent({
      necessary: true,
      analytics: true,
      preferences: true,
      marketing: true,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    });
    setShow(false);
  }

  function rejectOptional() {
    writeConsent({
      necessary: true,
      analytics: false,
      preferences: false,
      marketing: false,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    });
    setShow(false);
  }

  function saveCustom() {
    writeConsent({
      necessary: true,
      analytics,
      preferences,
      marketing,
      timestamp: Date.now(),
      version: CONSENT_VERSION,
    });
    setShow(false);
  }

  // a11y: dialog açılınca odağı içine al (ekran okuyucu duyurusu, preventScroll ile viewport
  // sıçramaz) + Escape ile kapan (KVKK-güvenli: yalnız zorunlu çerezler).
  useEffect(() => {
    if (!show) return;
    dialogRef.current?.focus({ preventScroll: true });
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") rejectOptional();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          ref={dialogRef}
          tabIndex={-1}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-4 inset-x-4 md:inset-x-auto md:left-6 md:right-6 lg:left-auto lg:right-6 lg:max-w-lg z-[60] outline-none"
          role="dialog"
          aria-modal="true"
          aria-labelledby="cookie-consent-title"
        >
          <div className="bg-paper-50 rounded-2xl shadow-2xl border border-paper-200 overflow-hidden">
            <div className="p-5 md:p-6">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-brand-100 text-brand-700 grid place-items-center shrink-0">
                  <Cookie size={18} weight="fill" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 id="cookie-consent-title" className="font-semibold text-ink-900 text-base">
                    Çerez tercihlerin
                  </h2>
                  <p className="mt-1 text-sm text-ink-700 leading-relaxed">
                    Site deneyimini iyileştirmek, ölçümleme yapmak ve sana uygun içerik göstermek
                    için çerez kullanıyoruz.{" "}
                    <Link
                      href="/yasal/cerez"
                      className="text-brand-700 hover:underline font-medium"
                    >
                      Çerez politikası
                    </Link>
                  </p>
                </div>
              </div>

              {showDetails && (
                <div className="mt-4 pt-4 border-t border-paper-200 space-y-3">
                  <ConsentToggle
                    label="Zorunlu çerezler"
                    desc="Sepet, oturum, CSRF ve güvenlik amaçlı çerezler. Site çalışması için zorunludur, devre dışı bırakılamaz."
                    checked
                    disabled
                  />
                  <ConsentToggle
                    label="Analitik çerezler"
                    desc="Google Analytics (GA4) ile anonimleştirilmiş trafik istatistikleri ve sayfa görüntüleme. IP adresi kısaltılır, kişisel kimlik toplanmaz."
                    checked={analytics}
                    onChange={setAnalytics}
                  />
                  <ConsentToggle
                    label="Kişiselleştirme çerezleri"
                    desc="Microsoft Clarity ile ısı haritası ve oturum kaydı. Gezinme davranışınız anonimleştirilmiş olarak kaydedilir (KVKK m.4/2-ç)."
                    checked={preferences}
                    onChange={setPreferences}
                  />
                  <ConsentToggle
                    label="Pazarlama çerezleri"
                    desc="Facebook (Meta) Pixel, Google Ads remarketing ve kişiselleştirilmiş reklam etiketleri. Reklam ağlarıyla paylaşılabilir."
                    checked={marketing}
                    onChange={setMarketing}
                  />
                </div>
              )}

              <div className="mt-5 flex flex-wrap items-center gap-2">
                <button
                  onClick={acceptAll}
                  className="flex-1 min-w-[140px] px-4 py-2.5 bg-brand-500 hover:bg-brand-600 text-ink-900 rounded-md text-sm font-semibold inline-flex items-center justify-center gap-1.5 transition-colors"
                >
                  <ShieldCheck size={14} weight="bold" /> Tümünü kabul et
                </button>
                {showDetails ? (
                  <button
                    onClick={saveCustom}
                    className="flex-1 min-w-[120px] px-4 py-2.5 bg-ink-900 text-paper-50 rounded-md text-sm font-semibold hover:bg-ink-700 transition-colors"
                  >
                    Tercihleri kaydet
                  </button>
                ) : (
                  <button
                    onClick={() => setShowDetails(true)}
                    className="px-4 py-2.5 border border-paper-200 hover:border-ink-300 text-ink-900 rounded-md text-sm font-medium transition-colors"
                  >
                    Tercihler
                  </button>
                )}
                <button
                  onClick={rejectOptional}
                  className="px-3 py-2 text-sm text-ink-500 hover:text-ink-900 transition-colors"
                >
                  Sadece zorunlu
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function ConsentToggle({
  label,
  desc,
  checked,
  disabled,
  onChange,
}: {
  label: string;
  desc: string;
  checked: boolean;
  disabled?: boolean;
  onChange?: (v: boolean) => void;
}) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <button
        type="button"
        onClick={() => !disabled && onChange?.(!checked)}
        disabled={disabled}
        role="switch"
        aria-checked={checked}
        aria-label={label}
        className={`relative w-9 h-5 rounded-full transition-colors shrink-0 mt-0.5 ${
          checked ? "bg-success" : "bg-paper-200"
        } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-paper-50 shadow-sm transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </button>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-ink-900">{label}</div>
        <div className="text-xs text-ink-500 mt-0.5">{desc}</div>
      </div>
    </label>
  );
}

/** Helper: bir consent kategorisi onaylı mı kontrol et — Analytics component'i bunu kullanabilir */
export function hasConsent(category: "analytics" | "preferences" | "marketing"): boolean {
  const c = readConsent();
  if (!c) return false;
  if (category === "preferences") return c.preferences ?? false;
  return c[category];
}

/**
 * Cookie consent banner'ını yeniden açan helper.
 * Footer veya başka herhangi bir yerden çağrılabilir:
 *   <button onClick={openCookieSettings}>Çerez Tercihleri</button>
 */
export function openCookieSettings(): void {
  if (typeof window === "undefined") return;
  window.dispatchEvent(new Event(REOPEN_EVENT));
}

/**
 * Hook formu: aynı işlevi React component içinde kullanmak için.
 *   const open = useCookieSettings();
 *   <button onClick={open}>Çerez Tercihleri</button>
 */
export function useCookieSettings(): () => void {
  return openCookieSettings;
}
