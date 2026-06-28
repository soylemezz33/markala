"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@markala/ui";
import { Wrench, FileArrowUp } from "@phosphor-icons/react";

interface Spec {
  label: string;
  value: string;
}

const TABS = [
  { id: "tech", label: "Teknik Özellikler", icon: Wrench },
  { id: "files", label: "Dosya Hazırlama", icon: FileArrowUp },
] as const;

type TabId = (typeof TABS)[number]["id"];

/**
 * Ürün detayları — tam genişlik sekmeli alan (hero'nun altında).
 * Teknik Özellikler GERÇEK product.specifications'tan gelir (eski jenerik veri kaldırıldı).
 * Açıklama hero'da, SSS + Yorumlar ayrı tam-genişlik bölümlerde (SEO microdata + server render).
 */
export function ProductTabs({ specifications = [] }: { specifications?: Spec[] }) {
  const [active, setActive] = useState<TabId>("tech");

  return (
    <div>
      {/* Tab nav */}
      <div className="border-b border-paper-200 flex gap-1 overflow-x-auto">
        {TABS.map((t) => {
          const isActive = active === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActive(t.id)}
              className={cn(
                "relative flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors",
                isActive ? "text-ink-900" : "text-ink-500 hover:text-ink-700",
              )}
            >
              <t.icon size={16} />
              {t.label}
              {isActive && (
                <motion.span
                  layoutId="active-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-500 rounded-full"
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={active}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="py-8"
        >
          {active === "tech" &&
            (specifications.length > 0 ? (
              <dl className="grid sm:grid-cols-2 gap-3">
                {specifications.map((s) => (
                  <div
                    key={s.label}
                    className="flex items-baseline justify-between gap-4 p-4 bg-paper-100 rounded-lg border border-paper-200"
                  >
                    <dt className="text-sm text-ink-500">{s.label}</dt>
                    <dd className="text-sm font-medium text-ink-900 text-right">{s.value}</dd>
                  </div>
                ))}
              </dl>
            ) : (
              <p className="text-sm text-ink-500">Teknik özellik bilgisi yakında eklenecek.</p>
            ))}

          {active === "files" && (
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-5 bg-paper-100 border border-paper-200 rounded-lg">
                <h3 className="font-semibold text-ink-900 mb-2">📐 Dosya hazırlama önerileri</h3>
                <ul className="space-y-2 text-sm text-ink-700">
                  <li>• <strong>3 mm taşma payı</strong> bırakın — kesim hatasını önler</li>
                  <li>• <strong>CMYK</strong> renk profili kullanın — RGB baskıda renkler değişebilir</li>
                  <li>• <strong>300 DPI</strong> minimum çözünürlük</li>
                  <li>• Yazıları <strong>&quot;outline&quot; / &quot;convert to curves&quot;</strong> yapın</li>
                </ul>
              </div>
              <div className="p-5 bg-brand-50 border border-brand-200 rounded-lg">
                <h3 className="font-semibold text-ink-900">💡 Tasarımınız yok mu?</h3>
                <p className="mt-1 text-sm text-ink-700">
                  Konfigüratörde <strong>&quot;Tasarım desteği istiyorum&quot;</strong> seçeneğini açın —
                  profesyonel grafik ekibimiz sizin için hazırlasın.
                </p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
