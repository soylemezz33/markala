"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { WhatsappLogo, Phone, X, ChatCircleText } from "@phosphor-icons/react";
import { track } from "@/lib/analytics";

const WHATSAPP_NUMBER = "903244333351";
const PHONE_NUMBER = "+903244333351";
const QUICK_MESSAGE = "Merhaba, Markala'dan bilgi almak istiyorum.";

/**
 * Sağ alt köşede sabit aksiyon butonları:
 * - WhatsApp (öncelikli, brand renk)
 * - Telefon
 * - Açılır mini menü ile mesaj seçenekleri
 *
 * Mobilde alt sağ, desktop'ta da aynı yer ama daha küçük.
 * Scroll'dan bağımsız her zaman görünür.
 */
export function FloatingActions() {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // 600ms gecikmeli görün, page jank'ı önle
    const t = setTimeout(() => setMounted(true), 600);
    return () => clearTimeout(t);
  }, []);

  // Escape key → panel kapat (WCAG 2.1.2 No Keyboard Trap)
  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  if (!mounted) return null;

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 z-40 flex flex-col items-end gap-3">
      {/* Açılır mini panel */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="bg-paper-50 rounded-2xl shadow-2xl border border-paper-200 overflow-hidden w-72 mb-1"
            role="dialog"
            aria-modal="true"
            aria-labelledby="floating-actions-title"
          >
            <div className="px-5 py-4 bg-ink-900 text-paper-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2
                    id="floating-actions-title"
                    className="font-semibold text-sm"
                  >
                    Markala Destek
                  </h2>
                  <div className="text-[11px] text-paper-100/70">
                    09:00 - 18:00 · Pzt-Cum
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  className="p-1.5 -mr-1.5 rounded text-paper-50/70 hover:text-paper-50 hover:bg-white/10"
                  aria-label="Kapat"
                >
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="p-3 space-y-2">
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(QUICK_MESSAGE)}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => track("contact", { method: "whatsapp", location: "floating" })}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-paper-100 transition-colors"
              >
                <span className="w-9 h-9 rounded-full bg-[#25D366] text-white grid place-items-center shrink-0">
                  <WhatsappLogo size={20} weight="fill" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink-900">WhatsApp</div>
                  <div className="text-[11px] text-ink-500">Anında yanıt</div>
                </div>
              </a>
              <a
                href={`tel:${PHONE_NUMBER}`}
                onClick={() => track("contact", { method: "phone", location: "floating" })}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-paper-100 transition-colors"
              >
                <span className="w-9 h-9 rounded-full bg-brand-500 text-ink-900 grid place-items-center shrink-0">
                  <Phone size={18} weight="fill" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink-900">Telefon</div>
                  <div className="text-[11px] text-ink-500 font-mono">0324 433 33 51</div>
                </div>
              </a>
              <a
                href="/iletisim"
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-paper-100 transition-colors"
              >
                <span className="w-9 h-9 rounded-full bg-paper-200 text-ink-700 grid place-items-center shrink-0">
                  <ChatCircleText size={18} weight="fill" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink-900">İletişim Formu</div>
                  <div className="text-[11px] text-ink-500">Detaylı talep gönder</div>
                </div>
              </a>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Ana FAB */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "İletişimi kapat" : "İletişim seçenekleri"}
        className={`relative w-14 h-14 md:w-16 md:h-16 rounded-full shadow-lg grid place-items-center text-paper-50 transition-all hover:scale-105 active:scale-95 ${
          open
            ? "bg-ink-900 hover:bg-ink-700"
            : "bg-[#25D366] hover:bg-[#1FB358]"
        }`}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <X size={24} weight="bold" />
            </motion.div>
          ) : (
            <motion.div
              key="wa"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <WhatsappLogo size={28} weight="fill" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pulse ring — prefers-reduced-motion'da durdur (WCAG 2.3.3) */}
        {!open && !shouldReduceMotion && (
          <span className="absolute inset-0 rounded-full bg-[#25D366] opacity-40 animate-ping" />
        )}
      </button>
    </div>
  );
}
